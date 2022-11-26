import React, { useEffect, useMemo, useState } from 'react';
import ReactCrop, { PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ASPECT = 9 / 20;
const MAX_HEIGHT = 2400;

interface Size {
  width: number;
  height: number;
}

const noDrop: React.ComponentProps<'div'> = {
  onDrop: (e) => e.stopPropagation(),
  onDragOver: (e) => e.stopPropagation(),
};

const initBox: PixelCrop = {
  unit: 'px',
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

interface Props {
  name: string;
  image: HTMLImageElement;
  onClear: () => void;
}

export const Editor: React.FC<Props> = ({ name, image, onClear }) => {
  const [size, setSize] = useState<Size>();
  const [zoom, setZoom] = useState(1);
  const [box, setBox] = useState<PixelCrop>(initBox);
  const [staged, setStaged] = useState<HTMLCanvasElement>();
  const calc = () => {
    const rect = document.querySelector('.canvas')?.getBoundingClientRect();
    if (!rect) {
      throw new Error('fail to get bouding client rect');
    }
    const zoom = Math.max(image.naturalWidth / rect.width, image.naturalHeight / rect.height, 1);
    const size = { width: image.naturalWidth / zoom, height: image.naturalHeight / zoom };
    setBox(calcCenter(size));
    setSize(size);
    setZoom(zoom);
  };
  useEffect(calc, [image]);
  useEffect(() => {
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('resize', calc);
    };
  }, [calc]);
  return (
    <>
      <div className="canvas flex-col fit">
        <ReactCrop crop={box} aspect={ASPECT} minWidth={100} minHeight={100} onChange={setBox}>
          <img src={image.src} alt="" style={{ maxWidth: size?.width, maxHeight: size?.height }} />
        </ReactCrop>
      </div>
      <div className="actions" {...noDrop}>
        <button onClick={onClear}>clear</button>
        <button
          className="fine"
          onClick={() => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
            setStaged(crop(canvas, box, zoom));
          }}
        >
          crop
        </button>
      </div>
      {staged && (
        <Preview
          canvas={staged}
          onCancel={() => setStaged(undefined)}
          onDownload={() => {
            download(name, staged.height > MAX_HEIGHT ? scale(staged, MAX_HEIGHT / staged.height) : staged);
            setStaged(undefined);
          }}
        />
      )}
    </>
  );
};

const Preview: React.FC<{ canvas: HTMLCanvasElement; onCancel: () => void; onDownload: () => void }> = ({
  canvas,
  onCancel,
  onDownload,
}) => {
  const src = useMemo(() => canvas.toDataURL(), [canvas]);
  return (
    <div className="backdrop fixed flex-col" {...noDrop}>
      <div className="modal flex-col">
        <div className="fit">
          <img src={src} alt="" />
        </div>
        <div className="actions">
          <button onClick={onCancel}>cancel</button>
          <button className="fine" onClick={onDownload}>
            download
          </button>
        </div>
      </div>
    </div>
  );
};

const calcCenter = (size: Size): PixelCrop => {
  let height = size.height;
  let width = (size.height / 20) * 9;
  let x = 0;
  let y = 0;
  if (width > size.width) {
    width = size.width;
    height = (size.width / 9) * 20;
    y = (size.height - height) / 2;
  } else {
    x = (size.width - width) / 2;
  }
  return { unit: 'px', x, y, width, height };
};

const crop = (canvas: HTMLCanvasElement, box: PixelCrop, zoom: number) => {
  const cropped = document.createElement('canvas');
  cropped.width = box.width * zoom;
  cropped.height = box.height * zoom;
  cropped
    .getContext('2d')
    ?.drawImage(canvas, box.x * zoom, box.y * zoom, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
};

const scale = (canvas: HTMLCanvasElement, rate: number) => {
  canvas.getContext('2d')?.scale(rate, rate);
  const scaled = document.createElement('canvas');
  scaled.width = canvas.width * rate;
  scaled.height = canvas.height * rate;
  scaled.getContext('2d')?.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  return scaled;
};

const download = (name: string, canvas: HTMLCanvasElement) => {
  const a = document.createElement('a');
  a.download = `${name}.webp`;
  a.href = canvas.toDataURL('image/webp');
  a.click();
};
