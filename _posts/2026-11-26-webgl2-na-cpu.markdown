---
layout: post
title:  "WebGL2 na CPU"
date:   2026-11-26 16:00:00 -0300
categories: rasterizer
chapter_title: "WebGL2 na CPU"
tags: rasterizer webgl
---

O nosso rasterizador, agora por trás da API do WebGL2, no `webgl2-cpu.js`. Quem desenha ainda é a CPU; o programa só manda os dados (buffers, texturas, uniforms) e escolhe os shaders, que aqui são funções JavaScript.

Primeiro, o cubo com textura: um vertex shader que leva cada vértice para a tela e um fragment shader que só lê a cor da textura.

{% include canvas.html id="cubo-webgl" files="rasterizer/webgl-cpu/cubo.js, rasterizer/webgl-cpu/webgl2-cpu.js" width=400 height=400 %}

O WebGL é uma máquina de estados: quase toda chamada liga alguma coisa (um programa, um buffer, uma textura) ou usa o que está ligado. Como a nossa "GPU" roda na CPU, dá para gravar o primeiro quadro do mesmo `cubo.js` e andar por ele passo a passo: a cada chamada, o estado dela, o canvas e as linhas marcadas no `cubo.js` e no `webgl2-cpu.js`. Dentro do `drawArrays`, o passo a passo para depois do vertex shader e depois de cada triângulo.

{% include canvas.html id="cubo-passo-a-passo" files="rasterizer/webgl-cpu/cubo.js, rasterizer/webgl-cpu/webgl2-cpu.js" hidden="rasterizer/webgl-cpu/stepper.js, rasterizer/webgl-cpu/passo-a-passo.html, rasterizer/webgl-cpu/passo-a-passo.css" width=760 height=480 %}
