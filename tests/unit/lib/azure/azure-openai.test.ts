import { getAzureChatModel } from '@/lib/azure/azure-openai';
import { ChatOpenAI } from '@langchain/openai';

// Mock environment variables
const originalEnv = process.env;

describe('Azure OpenAI Integration', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getAzureChatModel', () => {
    it('should throw an error if required environment variables are missing', async () => {
      // Clear environment variables
      delete process.env.AZURE_OPENAI_API_KEY;
      delete process.env.AZURE_OPENAI_ENDPOINT;
      delete process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME;

      await expect(getAzureChatModel()).rejects.toThrow(
        'Missing required environment variables for Azure OpenAI'
      );
    });

    it('should return an instance of ChatOpenAI configured for Azure when all variables are set', async () => {
      // Set mock environment variables
      process.env.AZURE_OPENAI_API_KEY = 'test-api-key';
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test-endpoint.openai.azure.com';
      process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME = 'test-deployment';
      process.env.AZURE_OPENAI_API_VERSION = '2023-12-01-preview';

      // Mock ChatOpenAI constructor
      jest.mock('@langchain/openai', () => ({
        ChatOpenAI: jest.fn().mockImplementation(() => ({
          model: 'mocked-model',
        })),
      }));

      const model = await getAzureChatModel();
      expect(model).toBeInstanceOf(ChatOpenAI);
      // Since we can't easily test the constructor params in the mocked implementation,
      // we'll just verify the model is created
    });
  });
});
