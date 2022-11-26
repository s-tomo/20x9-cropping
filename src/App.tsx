import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-image-crop/dist/ReactCrop.css';
import { Editor } from './Editor';

import './styles.css';

interface ImageFile {
  name: string;
  image: HTMLImageElement;
}

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      } else {
        reject('fail to load image');
      }
    };
    reader.readAsDataURL(file);
  });

const loadFile = async (file: File) => ({
  name: file.name.replace(/\.\w+$/, ''),
  image: await loadImage(file),
});

export const App: React.FC = () => {
  const [file, setFile] = useState<ImageFile>();
  const load = async (file: File | null | undefined) => file && setFile(await loadFile(file));
  return (
    <section
      className="fixed flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        load(e.dataTransfer.files[0]);
      }}
    >
      {file ? (
        <Editor {...file} onClear={() => setFile(undefined)} />
      ) : (
        <input type="file" onChange={(e) => load(e.currentTarget.files?.[0])} />
      )}
    </section>
  );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
