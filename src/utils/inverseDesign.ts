import {
  InverseDesignInput,
  InverseDesignResult,
  MixDesignInput,
} from '../types/concrete';
import { RandomForestRegressor } from './mlEngine';

/**
 * Validates concrete mix design inputs against physical limits and ASTM standards.
 */
export function validateMixInputs(mix: MixDesignInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (mix.cement < 100 || mix.cement > 650) {
    errors.push('Cement content must be between 100 and 650 kg/m³ (typical structural concrete).');
  }
  if (mix.slag < 0 || mix.slag > 400) {
    errors.push('Blast furnace slag must be between 0 and 400 kg/m³.');
  }
  if (mix.ash < 0 || mix.ash > 250) {
    errors.push('Fly ash must be between 0 and 250 kg/m³.');
  }
  if (mix.water < 100 || mix.water > 280) {
    errors.push('Water content must be between 100 and 280 kg/m³.');
  }
  if (mix.superplastic < 0 || mix.superplastic > 35) {
    errors.push('Superplasticizer must be between 0 and 35 kg/m³.');
  }
  if (mix.coarseagg < 700 || mix.coarseagg > 1300) {
    errors.push('Coarse aggregate must be between 700 and 1300 kg/m³.');
  }
  if (mix.fineagg < 500 || mix.fineagg > 1100) {
    errors.push('Fine aggregate must be between 500 and 1100 kg/m³.');
  }
  if (mix.age < 1 || mix.age > 365) {
    errors.push('Curing age must be between 1 and 365 days.');
  }

  const totalBinder = mix.cement + mix.slag + mix.ash;
  if (totalBinder <= 0) {
    errors.push('Total cementitious binder (Cement + Slag + Ash) must be greater than zero.');
  } else {
    const wb = mix.water / totalBinder;
    if (wb < 0.22) {
      errors.push(`Water-to-binder ratio (${wb.toFixed(2)}) is unrealistically low (< 0.22), risking severe unhydrated cement cores and zero workability.`);
    } else if (wb > 0.85) {
      errors.push(`Water-to-binder ratio (${wb.toFixed(2)}) exceeds maximum durability limits (> 0.85 per ACI 318).`);
    }
  }

  const totalDensity =
    mix.cement +
    mix.slag +
    mix.ash +
    mix.water +
    mix.superplastic +
    mix.coarseagg +
    mix.fineagg;

  if (totalDensity < 2000 || totalDensity > 2700) {
    errors.push(
      `Calculated fresh concrete density (${totalDensity.toFixed(0)} kg/m³) deviates significantly from normal-weight concrete (2200 - 2500 kg/m³). Check aggregate proportions.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates inverse design problem inputs.
 */
export function validateInverseInputs(input: InverseDesignInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (input.targetStrength < 5 || input.targetStrength > 90) {
    errors.push('Target compressive strength must be between 5 and 90 MPa (standard to ultra-high performance range in UCI dataset).');
  }
  if (input.age < 1 || input.age > 365) {
    errors.push('Target age must be between 1 and 365 days (typically 28 days for standard design compliance).');
  }
  if (input.cement < 120 || input.cement > 600) {
    errors.push('Cement content must be between 120 and 600 kg/m³.');
  }
  if (input.slag < 0 || input.slag > 350) {
    errors.push('Slag must be between 0 and 350 kg/m³.');
  }
  if (input.ash < 0 || input.ash > 200) {
    errors.push('Fly ash must be between 0 and 200 kg/m³.');
  }
  if (input.coarseagg < 750 || input.coarseagg > 1250) {
    errors.push('Coarse aggregate must be between 750 and 1250 kg/m³.');
  }
  if (input.fineagg < 550 || input.fineagg > 1050) {
    errors.push('Fine aggregate must be between 550 and 1050 kg/m³.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Inverse Design Method using Constrained Surrogate Optimization:
 *
 * Given fixed inputs:
 *   - Target Strength f'_c (target)
 *   - Target Age
 *   - Cement, Slag, Fly Ash
 *   - Coarse Aggregate, Fine Aggregate
 *
 * Find optimal (Water, Superplasticizer) in physical domain:
 *   W in [120, 240] kg/m³
 *   SP in [0, 25] kg/m³
 *
 * Objective Loss:
 *   Loss(W, SP) = | f_hat(W, SP) - f'_target |
 *                + Penalty(w/b outside [0.28, 0.70])
 *                + Penalty(SP dosage > 3.0% of binder)
 *                + Penalty(Density outside [2250, 2480])
 */
export function solveInverseMixDesign(
  input: InverseDesignInput,
  rfModel: RandomForestRegressor
): InverseDesignResult {
  const warnings: string[] = [];
  const binder = input.cement + input.slag + input.ash;

  if (binder <= 0) {
    return {
      success: false,
      water: 0,
      superplastic: 0,
      predictedStrength: 0,
      deviation: 999,
      wbRatio: 0,
      totalBinder: 0,
      density: 0,
      workabilityNote: 'Invalid binder content',
      convergenceDetails: {
        iterations: 0,
        objectiveLoss: 999,
        searchBoundWater: [0, 0],
        searchBoundSP: [0, 0],
      },
      warnings: ['Total binder must be greater than zero.'],
    };
  }

  // Workability target guidelines for SP search bound
  let minSP = 0;
  let maxSP = Math.min(25, binder * 0.035); // Max 3.5% binder weight
  if (input.slumpTarget === 'high') {
    minSP = Math.max(4.0, binder * 0.008);
  } else if (input.slumpTarget === 'self-compacting') {
    minSP = Math.max(8.0, binder * 0.015);
  }

  // Water search boundaries bounded by valid w/b ratio: 0.28 <= w/b <= 0.68
  const minWater = Math.max(120, Math.round(binder * 0.28));
  const maxWater = Math.min(240, Math.round(binder * 0.68));

  let bestW = 180;
  let bestSP = 5;
  let bestLoss = Infinity;
  let bestPredStrength = 0;
  let iterationsCount = 0;

  // Multi-grid search over candidate space
  const wSteps = 30;
  const spSteps = 25;

  for (let i = 0; i <= wSteps; i++) {
    const candW = minWater + (i / wSteps) * (maxWater - minWater);
    const wb = candW / binder;

    for (let j = 0; j <= spSteps; j++) {
      iterationsCount++;
      const candSP = minSP + (j / spSteps) * (maxSP - minSP);
      const spRatio = candSP / binder;

      // Build feature vector: [cement, slag, ash, water, superplastic, coarseagg, fineagg, age]
      const row = [
        input.cement,
        input.slag,
        input.ash,
        candW,
        candSP,
        input.coarseagg,
        input.fineagg,
        input.age,
      ];

      const pred = rfModel.predictRow(row).mean;
      const strengthDiff = Math.abs(pred - input.targetStrength);

      // Penalties for physical consistency
      let penalty = 0;
      if (wb < 0.30) penalty += (0.30 - wb) * 40;
      if (wb > 0.65) penalty += (wb - 0.65) * 50;
      if (spRatio > 0.025) penalty += (spRatio - 0.025) * 200;

      // Penalize excessive SP if water is already very high (illogical mix design)
      if (candW > 200 && candSP > 8) {
        penalty += (candW - 200) * 0.2 + (candSP - 8) * 1.5;
      }

      const totalLoss = strengthDiff + penalty;

      if (totalLoss < bestLoss) {
        bestLoss = totalLoss;
        bestW = candW;
        bestSP = candSP;
        bestPredStrength = pred;
      }
    }
  }

  // Local Nelder-Mead / Coordinate fine refinement around (bestW, bestSP)
  const fineStepW = 1.0;
  const fineStepSP = 0.2;
  for (let dw = -4; dw <= 4; dw++) {
    for (let dsp = -4; dsp <= 4; dsp++) {
      iterationsCount++;
      const candW = Math.max(minWater, Math.min(maxWater, bestW + dw * fineStepW));
      const candSP = Math.max(minSP, Math.min(maxSP, bestSP + dsp * fineStepSP));
      const wb = candW / binder;

      const row = [
        input.cement,
        input.slag,
        input.ash,
        candW,
        candSP,
        input.coarseagg,
        input.fineagg,
        input.age,
      ];

      const pred = rfModel.predictRow(row).mean;
      const strengthDiff = Math.abs(pred - input.targetStrength);

      let penalty = 0;
      if (wb < 0.30) penalty += (0.30 - wb) * 40;
      if (wb > 0.65) penalty += (wb - 0.65) * 50;
      if (candSP / binder > 0.025) penalty += (candSP / binder - 0.025) * 200;

      const totalLoss = strengthDiff + penalty;
      if (totalLoss < bestLoss) {
        bestLoss = totalLoss;
        bestW = candW;
        bestSP = candSP;
        bestPredStrength = pred;
      }
    }
  }

  const roundedW = Number(bestW.toFixed(1));
  const roundedSP = Number(bestSP.toFixed(2));
  const roundedPred = Number(bestPredStrength.toFixed(2));
  const finalWB = Number((roundedW / binder).toFixed(3));
  const density = Number(
    (
      input.cement +
      input.slag +
      input.ash +
      roundedW +
      roundedSP +
      input.coarseagg +
      input.fineagg
    ).toFixed(0)
  );

  const deviation = Number(Math.abs(roundedPred - input.targetStrength).toFixed(2));
  const success = deviation <= 2.5;

  if (deviation > 3.0) {
    warnings.push(
      `The required target strength (${input.targetStrength} MPa) is difficult to achieve with the selected binder quantity (${binder} kg/m³). Consider adjusting cement/SCM content.`
    );
  }

  if (finalWB < 0.32) {
    warnings.push(
      `Low water-to-binder ratio (${finalWB}). Requires rigorous polycarboxylate ether dispersion and high mixer shear to avoid clumping.`
    );
  }

  if (density < 2250 || density > 2500) {
    warnings.push(
      `Mixture density (${density} kg/m³) is outside the standard 2300 - 2450 kg/m³ range. Volumetric yield adjustment required per ACI 211.1.`
    );
  }

  warnings.push(
    'ASTM C39 & ACI 211.1 Mandatory Notice: Machine learning inverse estimation provides a baseline trial starting point only. Laboratory trial batches, slump flow (ASTM C143 / C1611), air content (ASTM C231), and standard moist-cured cylinder testing are mandatory before field batching.'
  );

  let workabilityNote = '';
  if (roundedSP === 0 && finalWB > 0.55) {
    workabilityNote = 'Stiff to moderate slump (50–100 mm) without chemical plasticizer.';
  } else if (roundedSP > 0 && roundedSP <= 6) {
    workabilityNote = `Medium to high slump (100–160 mm) with ${(
      (roundedSP / binder) *
      100
    ).toFixed(2)}% SP dosage.`;
  } else if (roundedSP > 6) {
    workabilityNote = `High slump to self-compacting rheology (> 180 mm slump / flow) with ${(
      (roundedSP / binder) *
      100
    ).toFixed(2)}% SP dosage.`;
  }

  return {
    success,
    water: roundedW,
    superplastic: roundedSP,
    predictedStrength: roundedPred,
    deviation,
    wbRatio: finalWB,
    totalBinder: binder,
    density,
    workabilityNote,
    convergenceDetails: {
      iterations: iterationsCount,
      objectiveLoss: Number(bestLoss.toFixed(3)),
      searchBoundWater: [minWater, maxWater],
      searchBoundSP: [Number(minSP.toFixed(1)), Number(maxSP.toFixed(1))],
    },
    warnings,
  };
}
