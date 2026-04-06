import { conversationAiParserService } from './src/services/conversation-ai-parser.service';

// Test conversation text
const testConversation = `
Hola, me llamo Maria Garcia. Soy de Mexico y tengo experiencia en limpieza.
Mi numero es 555-123-4567 y mi email es maria.garcia@email.com.
Estoy buscando trabajo en España. Puedo empezar en 2 semanas.
Tengo pasaporte valido y estoy lista para viajar.
`;

async function testAIParser() {
  console.log('🧪 Testing AI Conversation Parser...');
  console.log('Test conversation:', testConversation.substring(0, 100) + '...');

  try {
    const result = await conversationAiParserService.parse({
      text: testConversation,
      filename: 'test_conversation_20240101.txt'
    });

    console.log('✅ AI Parser Result:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n📊 Summary:');
    console.log(`- Confidence: ${result.confidence}`);
    console.log(`- Intent: ${result.intent}`);
    console.log(`- Priority: ${result.priority}`);
    console.log(`- Extracted fields: ${Object.keys(result.extractedFields).length}`);

  } catch (error) {
    console.error('❌ AI Parser failed:', error);
  }
}

// Run the test
testAIParser();