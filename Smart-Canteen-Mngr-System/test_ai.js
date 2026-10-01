import dotenv from 'dotenv';
dotenv.config();
import { generateAIInsights } from './src/services/ai.service.js';

async function test() {
  const res = await generateAIInsights();
  console.log(res);
  process.exit(0);
}
test();
