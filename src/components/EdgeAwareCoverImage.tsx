import { ImgHTMLAttributes, useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type EdgeAwareImageStyle = {
  objectPosition: string;
  baseScale: number;
  hoverScale: number;
};

export type EdgeAwareImageContentInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type EdgeAwareCoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'> & {
  imgClassName?: string;
  defaultStyle?: Partial<EdgeAwareImageStyle>;
  containerAspectRatio?: number;
  objectFit?: 'cover' | 'contain';
  enableScale?: boolean;
  onContentInsetsChange?: (insets: EdgeAwareImageContentInsets | null) => void;
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

type SampledImageContentBounds = {
  leftRatio: number;
  rightRatio: number;
  topRatio: number;
  bottomRatio: number;
  widthRatio: number;
  heightRatio: number;
  largestMargin: number;
};

const sampleImageContentBounds = (img: HTMLImageElement): SampledImageContentBounds | null => {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  if (!naturalWidth || !naturalHeight) {
    return null;
  }

  const sampleMax = 160;
  const sampleWidth =
    naturalWidth >= naturalHeight
      ? sampleMax
      : Math.max(80, Math.round(sampleMax * (naturalWidth / naturalHeight)));
  const sampleHeight =
    naturalHeight > naturalWidth
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

  const leftRatio = left / sampleWidth;
  const rightRatio = (right + 1) / sampleWidth;
  const topRatio = top / sampleHeight;
  const bottomRatio = (bottom + 1) / sampleHeight;
  const marginLeft = leftRatio;
  const marginRight = 1 - rightRatio;
  const marginTop = topRatio;
  const marginBottom = 1 - bottomRatio;
  const largestMargin = Math.max(marginLeft, marginRight, marginTop, marginBottom);

  return {
    leftRatio,
    rightRatio,
    topRatio,
    bottomRatio,
    widthRatio: (right - left + 1) / sampleWidth,
    heightRatio: (bottom - top + 1) / sampleHeight,
    largestMargin,
  };
};

const computeRenderedImageBox = (
  containerWidth: number,
  containerHeight: number,
  naturalWidth: number,
  naturalHeight: number,
  objectFit: 'cover' | 'contain'
) => {
  const imageAspectRatio = naturalWidth / naturalHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  if (objectFit === 'contain') {
    if (imageAspectRatio > containerAspectRatio) {
      const width = containerWidth;
      const height = containerWidth / imageAspectRatio;
      return { width, height, offsetX: 0, offsetY: (containerHeight - height) / 2 };
    }

    const height = containerHeight;
    const width = containerHeight * imageAspectRatio;
    return { width, height, offsetX: (containerWidth - width) / 2, offsetY: 0 };
  }

  if (imageAspectRatio > containerAspectRatio) {
    const height = containerHeight;
    const width = containerHeight * imageAspectRatio;
    return { width, height, offsetX: (containerWidth - width) / 2, offsetY: 0 };
  }

  const width = containerWidth;
  const height = containerWidth / imageAspectRatio;
  return { width, height, offsetX: 0, offsetY: (containerHeight - height) / 2 };
};

const detectImageContentInsets = (
  img: HTMLImageElement,
  objectFit: 'cover' | 'contain'
): EdgeAwareImageContentInsets | null => {
  const sampledBounds = sampleImageContentBounds(img);
  if (!sampledBounds) {
    return null;
  }

  const containerWidth = img.clientWidth;
  const containerHeight = img.clientHeight;
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
    return null;
  }

  const renderedBox = computeRenderedImageBox(
    containerWidth,
    containerHeight,
    naturalWidth,
    naturalHeight,
    objectFit
  );

  return {
    top: clamp(renderedBox.offsetY + renderedBox.height * sampledBounds.topRatio, 0, containerHeight),
    right: clamp(
      containerWidth - (renderedBox.offsetX + renderedBox.width * sampledBounds.rightRatio),
      0,
      containerWidth
    ),
    bottom: clamp(
      containerHeight - (renderedBox.offsetY + renderedBox.height * sampledBounds.bottomRatio),
      0,
      containerHeight
    ),
    left: clamp(renderedBox.offsetX + renderedBox.width * sampledBounds.leftRatio, 0, containerWidth),
  };
};

const detectEdgeAwareImageStyle = (
  img: HTMLImageElement,
  containerAspectRatio: number,
  fallbackStyle: EdgeAwareImageStyle
): EdgeAwareImageStyle | null => {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  const sampledBounds = sampleImageContentBounds(img);

  if (!naturalWidth || !naturalHeight || !sampledBounds) {
    return null;
  }

  if (sampledBounds.largestMargin < 0.035) {
    return null;
  }

  const contentWidthRatio = clamp(sampledBounds.widthRatio + 0.06, 0.62, 1);
  const contentHeightRatio = clamp(sampledBounds.heightRatio + 0.06, 0.62, 1);
  const imageAspectRatio = naturalWidth / naturalHeight;
  const baseVisibleWidth = imageAspectRatio > containerAspectRatio ? containerAspectRatio / imageAspectRatio : 1;
  const baseVisibleHeight = imageAspectRatio > containerAspectRatio ? 1 : imageAspectRatio / containerAspectRatio;
  const baseScale = clamp(
    Math.max(baseVisibleWidth / contentWidthRatio, baseVisibleHeight / contentHeightRatio, fallbackStyle.baseScale),
    fallbackStyle.baseScale,
    1.34
  );

  const centerX = clamp((sampledBounds.leftRatio + sampledBounds.rightRatio) / 2, 0.15, 0.85);
  const centerY = clamp((sampledBounds.topRatio + sampledBounds.bottomRatio) / 2, 0.15, 0.85);

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
  objectFit = 'cover',
  enableScale = true,
  onContentInsetsChange,
  onLoad,
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
      onLoad={(event) => {
        onLoad?.(event);
        onContentInsetsChange?.(detectImageContentInsets(event.currentTarget, objectFit));
        if (!enableScale || objectFit !== 'cover') {
          return;
        }
        const nextStyle = detectEdgeAwareImageStyle(event.currentTarget, containerAspectRatio, mergedDefaultStyle);
        if (nextStyle) {
          setImageStyle(nextStyle);
        }
      }}
      className={cn(
        enableScale
          ? `absolute inset-0 h-full w-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-transform duration-700 [transform:scale(var(--cover-image-scale,1.08))] group-hover:[transform:scale(var(--cover-image-hover-scale,1.14))]`
          : `absolute inset-0 h-full w-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`,
        imgClassName
      )}
      style={
        {
          objectPosition: imageStyle.objectPosition,
          ...(enableScale
            ? {
                ['--cover-image-scale' as string]: String(imageStyle.baseScale),
                ['--cover-image-hover-scale' as string]: String(imageStyle.hoverScale),
              }
            : {}),
        } as CSSProperties
      }
    />
  );
};

export default EdgeAwareCoverImage;
