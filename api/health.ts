export default function handler(_req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    dataset: 'UCI Concrete Compressive Strength (1030 samples)',
    author: 'Aasaithambi A',
    institution: 'SASTRA Deemed University',
    context: 'Data Analytics for Civil Engineering - Laboratory Exercise 11',
  });
}
