import React, { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/constants";
import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Draggable from 'react-draggable';
import { Eraser } from 'lucide-react'
import { toast } from "sonner"
import { Toggle } from "@/components/ui/toggle"
import { Slider } from "@/components/ui/slider"



interface Response {
  expr: string;
  result: string;
  assign: boolean;
}
interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('rgba(255,255,255)');
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [dictOfVars, setDictOfVars] = useState({});
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
      setLatexExpression([]);
      setResult(null);
      setDictOfVars({});
    }
  }, [reset]);


  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;
      }
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/config/TeX-MML-AM_CHTML.js';
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] }
      });
    }
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const response = await axios({
          method: 'post',
          url: `${import.meta.env.VITE_API_URL}/calculate`,
          data: {
            image: canvas.toDataURL('image/png'),
            dict_of_vars: dictOfVars
          }
        });
        const resp = response.data;
        // const databody = {
        //   image: canvas.toDataURL('image/png'),
        //   dict_of_vars: dictOfVars
        // }
        // const response = await fetch("https://calc-be.vercel.app/calculate", {
        //   "headers": {
        //     "accept": "application/json, text/plain, */*",
        //     "accept-language": "en",
        //     "cache-control": "no-cache",
        //     "content-type": "application/json",
        //     "pragma": "no-cache",
        //     "priority": "u=1, i",
        //     "Referer": "https://calc-fe.vercel.app/",
        //     "Referrer-Policy": "strict-origin-when-cross-origin"
        //   },
        //   "body": JSON.stringify(databody),
        //   "method": "POST"
        // });
        // const resp = await response.json();
        console.log(resp.data);
        const satus = resp.status;
        const message = resp.message;
        toast(satus, {
          description: message,
        })
        resp.data.forEach((data: Response) => {
          if (data.assign === true) {
            setDictOfVars({ ...dictOfVars, [data.expr]: data.result });
          }
        });

        const ctx = canvas.getContext('2d');
        const imagedata = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        let minx = canvas.width;
        let miny = canvas.height;
        let maxx = 0;
        let maxy = 0;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (imagedata.data[(y * canvas.width + x) * 4 + 3] > 0) {
              if (x < minx) {
                minx = x;
              }
              if (y < miny) {
                miny = y;
              }
              if (x > maxx) {
                maxx = x;
              }
              if (y > maxy) {
                maxy = y;
              }
            }
          }
        }
        const centerX = (minx + maxx) / 2;
        const centerY = (miny + maxy) / 2;
        setLatexPosition({ x: centerX, y: centerY });
        resp.data.forEach((data: Response) => {
          setTimeout(() => {
            setResult({ expression: data.expr, answer: data.result });
          }, 100);
        });
      } catch (e) {
        console.log(e);
        toast("Error", {
          description: "Something went wrong",
        })
      }
    }
  }

  const renderLatexToCanvas = (expression: string, answer: string) => {
    const latex = `${expression} = ${answer}`;
    setLatexExpression([...latexExpression, latex]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = 'black';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  }
  const stopDrawing = () => {
    setIsDrawing(false);
  }
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  }
  return (
    <>

      <div className="grid grid-cols-3 gap-3 bg-black flex-auto m-5 outline-dotted outline-white outline-2 ">
        <Button onClick={() => setReset(true)}
          className="z-20 bg-black text-white"
          variant='default'
          color="black"
        >
          Reset
        </Button>
        <Button onClick={sendData}
          className="z-20 bg-black text-white"
          variant='default'
          color="black"
        >
          Calculate
        </Button>

        <Toggle aria-label="Toggle bold" className="z-20">
          <Eraser className="h-4 w-4 " />
        </Toggle>

        <Group className="z-20 ">
          {SWATCHES.map((swatchcolor: string) => {
            return (
              <ColorSwatch
                key={swatchcolor}
                color={swatchcolor}
                onClick={() => setColor(swatchcolor)}
              />
            );
          })}
        </Group>

        <div className="z-20 bg-white flex-1 align-middle">
          <Button className=""
          >
            <Eraser className="h-4 w-4" />
          </Button>

          <Slider defaultValue={[5]} max={20} step={1} />

          <label>5px</label>


        </div>



      </div>

      <canvas
        ref={canvasRef}
        id='canvas'
        className='absolute top-0 left-0 w-full h-full bg-black'
        onMouseDown={startDrawing}
        onMouseOut={stopDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}

      />
      {latexExpression && latexExpression.map((latex, index) => (
        <Draggable
          key={index}
          defaultPosition={latexPosition}
          onStop={(_e, data) => setLatexPosition({ x: data.x, y: data.y })}
        >
          <div className="absolute p-2 text-white rounded shadow-md">
            <div className="latex-content">{latex}</div>
          </div>
        </Draggable>
      ))}
    </>
  );

}