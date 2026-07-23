import { AIService } from '../src/lib/ai-service';

async function testAIService() {
  console.log('🧪 Starting AI Service Tests...\n');

  // Test 1: Chat Response (General inquiry & specific product inquiry)
  console.log('1️⃣ Testing AI Chat Agent (Store & Parts query)...');
  const chatReply1 = await AIService.processChat('Do you have brake pads for Suzuki Alto?');
  console.log('--------------------------------------------------');
  console.log(chatReply1);
  console.log('--------------------------------------------------\n');

  console.log('2️⃣ Testing AI Chat Agent (Location inquiry)...');
  const chatReply2 = await AIService.processChat('Where is your shop located and what are your phone numbers?');
  console.log('--------------------------------------------------');
  console.log(chatReply2);
  console.log('--------------------------------------------------\n');

  // Test 3: Parts Identification
  console.log('3️⃣ Testing AI Parts Identifier (Sample Image)...');
  const sampleBase64 = 'data:image/jpeg;base64,' + Buffer.from('BrakePadSampleImageContentData').toString('base64');
  const identifyResult = await AIService.identifyPart(sampleBase64);
  console.log('--------------------------------------------------');
  console.log('Part Identified:', identifyResult.partName);
  console.log('Category:', identifyResult.partCategory);
  console.log('Confidence:', identifyResult.confidence);
  console.log('Compatible Cars:', identifyResult.possibleCarModels.join(', '));
  if (identifyResult.matchedProduct) {
    console.log('Matched Inventory Item:', identifyResult.matchedProduct.name, '- PKR', identifyResult.matchedProduct.price);
  }
  console.log('--------------------------------------------------\n');

  // Test 4: Product Recommendations
  console.log('4️⃣ Testing AI Product Recommendations...');
  const recsResult = await AIService.getRecommendations(null, null, null);
  console.log('--------------------------------------------------');
  console.log('Recommendations Count:', recsResult.recommendations.length);
  console.log('Top Recommendation:', recsResult.recommendations[0]?.name);
  console.log('Reasoning:', recsResult.reasoning);
  console.log('--------------------------------------------------\n');

  console.log('✅ All AI Service Tests Completed Successfully!');
}

testAIService().catch((err) => {
  console.error('❌ AI Service Test Failed:', err);
  process.exit(1);
});
