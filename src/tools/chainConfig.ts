import {
  createPublicClient,
  http,
  Chain,
  createWalletClient,
  PublicClient,
  WalletClient,
  Transport,
  Hex,
} from "viem";
import * as chains from "viem/chains";
import { getChain } from "@zoralabs/chains";
import { privateKeyToAccount } from "viem/accounts";

export const makeClientsForChain = async (
  chainName: string
): Promise<{
  publicClient: PublicClient;
  walletClient: WalletClient<Transport, Chain>;
  chainId: number;
}> => {
  const configuredChain = await getChain(chainName);

  if (configuredChain.id === 9999999) {
    configuredChain.id = chains.zoraSepolia.id;
  }

  if (!configuredChain) {
    throw new Error(`No chain config found for chain name ${chainName}`);
  }

  const chainConfig = Object.values(chains).find(
    (x) => x.id === configuredChain.id
  );

  if (!chainConfig) {
    throw new Error(`No chain config found for chain id ${configuredChain.id}`);
  }

  const rpcUrl = configuredChain.rpcUrl;

  if (!rpcUrl) {
    throw new Error(`No RPC found for chain id ${configuredChain.id}`);
  }

  return {
    publicClient: createPublicClient({
      transport: http(),
      chain: {
        ...chainConfig,
        rpcUrls: {
          default: {
            http: [rpcUrl],
          },
          public: {
            http: [rpcUrl],
          },
        },
      },
    }) as PublicClient,
    walletClient: createWalletClient({
      transport: http(),
      chain: {
        ...chainConfig,
        rpcUrls: {
          default: {
            http: [rpcUrl],
          },
          public: {
            http: [rpcUrl],
          },
        },
      },
    }),
    chainId: configuredChain.id as number,
  };
};

export const getAccount = () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("No private key found");
  }
  return privateKeyToAccount(privateKey as Hex);
};
