// Keeps uploaded files in the browser (IndexedDB) so a page refresh doesn't lose them.
// Files never leave the viewer's computer through this.

const DB = "parkgrid-demo";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function saveFile(file: File): Promise<void> {
  try {
    await tx("readwrite", (s) => s.put(file, file.name));
  } catch {
    /* storage unavailable (private window etc.) — fine, just no persistence */
  }
}

export async function removeFile(name: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(name));
  } catch {
    /* ignore */
  }
}

export async function clearFiles(): Promise<void> {
  try {
    await tx("readwrite", (s) => s.clear());
  } catch {
    /* ignore */
  }
}

export async function loadFiles(): Promise<File[]> {
  try {
    const all = await tx<unknown[]>("readonly", (s) => s.getAll());
    return all.filter((f): f is File => f instanceof Blob).map((b) => (b instanceof File ? b : new File([b], "upload")));
  } catch {
    return [];
  }
}
