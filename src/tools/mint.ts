import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";
import { makeClientsForChain, getAccount } from "./chainConfig";
import { createCollectorClient } from "@zoralabs/protocol-sdk";
import { Address } from "viem";

export const mintTool = new DynamicStructuredTool({
  name: "mint",
  description: "Mint this NFT from a url",
  schema: z.object({
    url: z.string().describe("The URL to mint with"),
  }),
  func: async ({ url }: { url: string }) => {
    // Step 1: Parse the URL
    const parsedUrlData = parseUrl(url);

    // Step 2: Set up the blockchain clients
    const clients = await setupClients(parsedUrlData.chainName);

    // Step 3: Prepare the mint
    const mintPreparation = await prepareMint(clients, parsedUrlData);

    // Step 4: Execute the mint
    const mintResult = await executeMint(clients, mintPreparation);

    // Step 5: Verify the mint
    verifyMint(mintResult);

    return `Minted ${url}`;
  },
});

// Function to parse the URL and extract necessary information
function parseUrl(url: string) {
  const regex =
    /https:\/\/zora\.co\/collect\/(\w+):(\b0x[a-fA-F0-9]{40}\b)\/(\d+)/;
  const match = url.match(regex);
  if (!match) {
    throw new Error("Cannot parse URL");
  }
  const [_, platformName, contractAddress, tokenId] = match;
  const chainName = platformName === "zora" ? "zora" : "base";
  return { chainName, contractAddress, tokenId };
}

// Function to set up blockchain clients
async function setupClients(chainName: string) {
  return await makeClientsForChain(chainName);
}

// Function to prepare the mint
async function prepareMint(
  clients: Awaited<ReturnType<typeof makeClientsForChain>>,
  parsedUrlData: ReturnType<typeof parseUrl>
) {
  const collectorClient = createCollectorClient({
    chainId: clients.chainId,
    publicClient: clients.publicClient,
  });

  const { prepareMint } = await collectorClient.getToken({
    mintType: "1155",
    tokenContract: parsedUrlData.contractAddress as Address,
    tokenId: Number(parsedUrlData.tokenId),
  });

  if (!prepareMint) {
    throw new Error("No prepare mint found");
  }

  const minterAccount = getAccount();

  return await prepareMint({
    minterAccount,
    quantityToMint: 1n,
  });
}

// Function to execute the mint
async function executeMint(
  clients: Awaited<ReturnType<typeof makeClientsForChain>>,
  mintPreparation: Awaited<ReturnType<typeof prepareMint>>
) {
  const hash = await clients.walletClient.writeContract(
    mintPreparation.parameters
  );

  return await clients.publicClient.waitForTransactionReceipt({
    hash,
  });
}

// Function to verify the mint was successful
function verifyMint(receipt: Awaited<ReturnType<typeof executeMint>>) {
  if (receipt.status !== "success") {
    throw new Error("Mint failed");
  }
}
