import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type EdgeAwareImageStyle = {
  objectPosition: string;
  baseScale: number;
  hoverScale: number;
};

type EdgeAwareCoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'> & {
  imgClassName?: string;
  defaultStyle?: Partial<EdgeAwareImageStyle>;
  containerAspectRatio?: number;
};

const DEFAULT_IMAGE_STYLE: EdgeAwareImageStyle = {
  objectPosition: '50% 50%',
  baseScale: 1.08,
  hoverScale: 1.14,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readPixel = (data: Uint8ClampedArray, width: number, x: number, y: number) => {
  const safeX = clamp(Math.round(x), 0, width - 1);
  const safeY = clamp(Math.round(y), 0, data.length / 4 / width - 1);
  const offset = (safeY * width + safeX) * 4;
  return {
    r: data[offset],
    g: data[offset + 1],
    b: data[offset + 2],
    a: data[offset + 3],
  };
};

const colorDistance = (
  a: { r: number; g: number; b: number; a: number },
  b: { r: number; g: number; b: number; a: number }
) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) + Math.abs(a.a - b.a);

const detectEdgeAwareImageStyle = (
  img: HTMLImageElement,
  containerAspectRatio: number,
  fallbackStyle: EdgeAwareImageStyle
): EdgeAwareImageStyle | null => {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  if (!naturalWidth || !naturalHeight) {
    return null;
  }

  const sampleMax = 160;
  const sampleWidth = naturalWidth >= naturalHeight
    ? sampleMax
    : Math.max(80, Math.round(sampleMax * (naturalWidth / naturalHeight)));
  const sampleHeight = naturalHeight > naturalWidth
    ? sampleMax
    : Math.max(80, Math.round(sampleMax * (naturalHeight / naturalWidth)));

  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return null;
  }

  try {
    context.drawImage(img, 0, 0, sampleWidth, sampleHeight);
  } catch {
    return null;
  }

  let imageData: ImageData;
  try {
    imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);
  } catch {
    return null;
  }

  const { data } = imageData;
  const samplePoints = [
    [0, 0],
    [sampleWidth - 1, 0],
    [0, sampleHeight - 1],
    [sampleWidth - 1, sampleHeight - 1],
    [Math.round(sampleWidth / 2), 0],
    [Math.round(sampleWidth / 2), sampleHeight - 1],
    [0, Math.round(sampleHeight / 2)],
    [sampleWidth - 1, Math.round(sampleHeight / 2)],
  ];

  const background = samplePoints.reduce(
    (acc, [x, y]) => {
      const pixel = readPixel(data, sampleWidth, x, y);
      return {
        r: acc.r + pixel.r,
        g: acc.g + pixel.g,
        b: acc.b + pixel.b,
        a: acc.a + pixel.a,
      };
    },
    { r: 0, g: 0, b: 0, a: 0 }
  );

  const backgroundColor = {
    r: background.r / samplePoints.length,
    g: background.g / samplePoints.length,
    b: background.b / samplePoints.length,
    a: background.a / samplePoints.length,
  };

  const isContentPixel = (x: number, y: number) => {
    const pixel = readPixel(data, sampleWidth, x, y);
    if (pixel.a < 24) {
      return false;
    }
    return colorDistance(pixel, backgroundColor) > 42;
  };

  const columnHasContent = Array.from({ length: sampleWidth }, (_, x) => {
    let hits = 0;
    for (let y = 0; y < sampleHeight; y += 1) {
      if (isContentPixel(x, y)) {
        hits += 1;
      }
    }
    return hits / sampleHeight > 0.08;
  });

  const rowHasContent = Array.from({ length: sampleHeight }, (_, y) => {
    let hits = 0;
    for (let x = 0; x < sampleWidth; x += 1) {
      if (isContentPixel(x, y)) {
        hits += 1;
      }
    }
    return hits / sampleWidth > 0.08;
  });

  const left = columnHasContent.findIndex(Boolean);
  const right = sampleWidth - 1 - [...columnHasContent].reverse().findIndex(Boolean);
  const top = rowHasContent.findIndex(Boolean);
  const bottom = sampleHeight - 1 - [...rowHasContent].reverse().findIndex(Boolean);

  if (left < 0 || top < 0 || right <= left || bottom <= top) {
    return null;
  }

  const marginLeft = left / sampleWidth;
  const marginRight = (sampleWidth - 1 - right) / sampleWidth;
  const marginTop = top / sampleHeight;
  const marginBottom = (sampleHeight - 1 - bottom) / sampleHeight;
  const largestMargin = Math.max(marginLeft, marginRight, marginTop, marginBottom);

  if (largestMargin < 0.035) {
    return null;
  }

  const contentWidthRatio = clamp((right - left + 1) / sampleWidth + 0.06, 0.62, 1);
  const contentHeightRatio = clamp((bottom - top + 1) / sampleHeight + 0.06, 0.62, 1);
  const imageAspectRatio = naturalWidth / naturalHeight;
  const baseVisibleWidth = imageAspectRatio > containerAspectRatio ? containerAspectRatio / imageAspectRatio : 1;
  const baseVisibleHeight = imageAspectRatio > containerAspectRatio ? 1 : imageAspectRatio / containerAspectRatio;
  const baseScale = clamp(
    Math.max(baseVisibleWidth / contentWidthRatio, baseVisibleHeight / contentHeightRatio, fallbackStyle.baseScale),
    fallbackStyle.baseScale,
    1.34
  );

  const centerX = clamp((left + right) / 2 / sampleWidth, 0.15, 0.85);
  const centerY = clamp((top + bottom) / 2 / sampleHeight, 0.15, 0.85);

  return {
    objectPosition: `${Math.round(centerX * 100)}% ${Math.round(centerY * 100)}%`,
    baseScale,
    hoverScale: clamp(baseScale + 0.06, fallbackStyle.hoverScale, 1.4),
  };
};

const EdgeAwareCoverImage = ({
  alt,
  src,
  imgClassName,
  defaultStyle,
  containerAspectRatio = 4 / 3,
  onLoad,
  crossOrigin = 'anonymous',
  ...rest
}: EdgeAwareCoverImageProps) => {
  const mergedDefaultStyle: EdgeAwareImageStyle = {
    ...DEFAULT_IMAGE_STYLE,
    ...defaultStyle,
  };
  const [imageStyle, setImageStyle] = useState<EdgeAwareImageStyle>(mergedDefaultStyle);

  useEffect(() => {
    setImageStyle(mergedDefaultStyle);
  }, [
    src,
    mergedDefaultStyle.baseScale,
    mergedDefaultStyle.hoverScale,
    mergedDefaultStyle.objectPosition,
  ]);

  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      crossOrigin={crossOrigin}
      onLoad={(event) => {
        onLoad?.(event);
        const nextStyle = detectEdgeAwareImageStyle(event.currentTarget, containerAspectRatio, mergedDefaultStyle);
        if (nextStyle) {
          setImageStyle(nextStyle);
        }
      }}
      className={cn(
        'absolute inset-0 h-full w-full object-cover transition-transform duration-700 [transform:scale(var(--cover-image-scale,1.08))] group-hover:[transform:scale(var(--cover-image-hover-scale,1.14))]',
        imgClassName
      )}
      style={{
        objectPosition: imageStyle.objectPosition,
        ['--cover-image-scale' as '--cover-image-scale']: String(imageStyle.baseScale),
        ['--cover-image-hover-scale' as '--cover-image-hover-scale']: String(imageStyle.hoverScale),
      }}
    />
  );
};

export default EdgeAwareCoverImage;
