import localforage from "localforage";

const db = localforage.createInstance({ name: "annotations" });

export const saveAnnotation = async (docId, data) => {
  await db.setItem(docId, data);
};

export const loadAnnotation = async (docId) => {
  return await db.getItem(docId);
};
