import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createRetrieverTool } from "langchain/tools/retriever";

export const createRetriever = async () => {
  const loader = new DirectoryLoader("./docs/", {
    '.txt': (filename: string) => new TextLoader(filename),
  });

  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments(rawDocs);

  const vectorstore = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings()
  );
  const retriever = vectorstore.asRetriever();

  return createRetrieverTool(retriever, {
    name: "zora_search",
    description:
      "use this to for information about wow or zora from this database",
  });
};
