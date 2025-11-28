import {preloadQuery} from "convex/nextjs"
import { auth } from "@clerk/nextjs/server";
import { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Document } from "./document";

interface DocumentIdPageProps {
  params: Promise<{documentId : Id<"documents">}>;
}

const DocumentIdPage = async ({params}:DocumentIdPageProps) => {
  const awaitedParams = await params;
  const documentId = awaitedParams.documentId;
  

  const {getToken} = await auth()
  const token = await getToken({template:"convex"}) ?? undefined

  if(!token){
    throw new Error("Unauthorized")
  }
  const preloadedDocument = await preloadQuery(
    api.documents.getById,
    {id:documentId},
    {token}
  )

  if(!preloadedDocument){
    throw new Error("Document not found")
  }

  return <Document preloadedDocument={preloadedDocument} />
}

export default DocumentIdPage