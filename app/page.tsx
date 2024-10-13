"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Circle {
  x: number;
  y: number;
  radius: number;
}

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [circles, setCircles] = useState<Circle[]>([
    { x: 200, y: 200, radius: 500 },
    { x: 400, y: 400, radius: 1000 },
  ]);
  const [draggedCircle, setDraggedCircle] = useState<number | null>(null);

  const canvasWidth = 800;
  const canvasHeight = 600;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);

    // Draw circles
    circles.forEach((circle, index) => {
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = index === 0 ? "red" : "blue";
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    });

    ctx.restore();
  }, [image, scale, offset, circles]);

  useEffect(() => {
    const img = new Image();
    img.src = "/map.png";
    img.onload = () => {
      setImage(img);
      setOffset({
        x: (canvasWidth - img.width) / 2,
        y: (canvasHeight - img.height) / 2,
      });
    };
  }, []);

  useEffect(() => {
    if (image) draw();
  }, [image, draw]);

  const constrainOffset = useCallback(
    (newOffset: { x: number; y: number }) => {
      if (!image) return newOffset;

      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      const minX = canvasWidth - scaledWidth;
      const minY = canvasHeight - scaledHeight;

      return {
        x: Math.min(0, Math.max(minX, newOffset.x)),
        y: Math.min(0, Math.max(minY, newOffset.y)),
      };
    },
    [image, scale]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - offset.x) / scale;
    const mouseY = (e.clientY - rect.top - offset.y) / scale;

    // Check if we're clicking on a circle
    const clickedCircleIndex = circles.findIndex(
      (circle) =>
        Math.sqrt((mouseX - circle.x) ** 2 + (mouseY - circle.y) ** 2) <=
        circle.radius
    );

    if (clickedCircleIndex !== -1) {
      setDraggedCircle(clickedCircleIndex);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (draggedCircle !== null) {
      const mouseX = (e.clientX - rect.left - offset.x) / scale;
      const mouseY = (e.clientY - rect.top - offset.y) / scale;

      setCircles(
        circles.map((circle, index) =>
          index === draggedCircle ? { ...circle, x: mouseX, y: mouseY } : circle
        )
      );
    } else if (isDragging) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setOffset(constrainOffset(newOffset));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedCircle(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.1, Math.min(5, scale + delta));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
      const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

      setScale(newScale);
      setOffset(constrainOffset({ x: newOffsetX, y: newOffsetY }));
    }
  };

  const handleReset = () => {
    if (image) {
      setScale(1);
      setOffset({
        x: (canvasWidth - image.width) / 2,
        y: (canvasHeight - image.height) / 2,
      });
      setCircles([
        { x: 200, y: 200, radius: 50 },
        { x: 400, y: 400, radius: 100 },
      ]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="flex space-x-2">
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="border border-gray-300 cursor-move"
      />
      <div className="text-sm">
        <p>Zoom level: {(scale * 100).toFixed(0)}%</p>
        <p>
          Offset: x={offset.x.toFixed(0)}, y={offset.y.toFixed(0)}
        </p>
        <p>
          Red Circle: x={circles[0].x.toFixed(0)}, y={circles[0].y.toFixed(0)}
        </p>
        <p>
          Blue Circle: x={circles[1].x.toFixed(0)}, y={circles[1].y.toFixed(0)}
        </p>
      </div>
    </div>
  );
}
