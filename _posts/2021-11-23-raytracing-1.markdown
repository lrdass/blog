---
layout: post
title:  "What is raytracing all about?"
date:   2021-11-23 22:14:05 -0300
categories: raytracing
---


I hope to accomplish with this text a simple endevour that I wanted to write for about a few months:
I want to explain in very simple lines how computer graphics works in simple terms.
There will be some math, but don't worry: I want to make this the most didatical I possibly can. I hope you tag along 
this journey through computer graphics and endup finding yourself amazed by it too.

We going to start with just a single function that put a pixel color in a position of the screen. And from there, I'm going
to explain how we going to "project" tridimensional images onto the screen.
We going to aproach this challenge starting by the most straight forward method first: Raytracing. Which means we going to do exactly
what light does, but, in reverse.
It may sound weird at first, but trust me: it is pretty simple.
So buckle up, and lets get started!

## Where we are going to draw
So lets call the place where we draw colors "canvas". The computer screen is just an matrix of pixels, which are, in the standard RGB model, sum of the three component colors: Red, Green and Blue.
You could visualize the screen as :
![Screen](./images/put_pixel.png)

So we are going to start by using an method `canvas.putPixel(positionX, positionY, color)` which is going to put a pixel at an specified position with a particular color.

But we must understand that, because the canvas works as an matrix, the way we access it is not like an cartesian map. `(0,0)` it's not the center of the screen, but the top left corner of the canvas.




