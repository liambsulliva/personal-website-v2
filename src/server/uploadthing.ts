// File Router
import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  photographyUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    return { fileUrl: file.url };
  }),
  featuredPhotographyUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    return { fileUrl: file.url };
  }),
  layoutsPdfUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    return { fileUrl: file.url };
  }),
  graphicDesignPdfUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    return { fileUrl: file.url };
  }),
  presentationsPdfUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    return { fileUrl: file.url };
  }),
  cookingPdfUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 20 },
  }).onUploadComplete(async ({ file }) => {
    return { fileUrl: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
