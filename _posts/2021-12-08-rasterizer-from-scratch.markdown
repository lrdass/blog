---
layout: post
title:  "Do pixel para um rasterizador"
date:   2021-12-15 10:10:05 -0300
categories: rasterizer
---

Decidi escrever este texto em portugues porque pensei: "humm.. acho que ja existe material mais que suficiente em ingles, mas para o publico brasileiro existe pouco material" e eu pensei no pequeno eu com 12 anos que queria entender como computação grafica funcionava e não tinha acesso nem a livros bem escritos quanto compreensão de ingles o suficiente.
Então pensando nisso, decidi escrever em portugues

## O que você deve esperar?

Daqui em diante eu quero te levar em uma sequencia de textos para desmistificar algumas ideias de matematica e computação. A ideia é te mostrar que tudo pode ser mais simples. Eu vou mostrar os calculos e como chegar neles e acho que essa forma de "abrir" e "levantar os véus" [Apokalipsis](https://en.wikipedia.org/wiki/Apokalypsis) é o melhor jeito de aprender sobre um assunto.
O texto irá da ideia simples de como desenhar um pixel na tela, e seguiremos a sequencia de: como desenhar uma linha, como desenhar um triangulo, como preencher este triangulo, como desenhar uma figura tridimensional projetada em uma superficie bidimensional, e preencher com o mesmo algoritmo de triangulos, como colocar perspectiva nos triangulos que iremos desenhar.
Com isto tudo em mente nos proximos textos vamos abortar as bibliotecas graficas que conversam com a placa de video e fazem tudo isso para o desenvolvedor e de forma rapida.

## O que voce precisa saber?

Gostaria que ninguem precisasse saber nada. Não precisa perfeitamente confortavel com matematica, mas caso não seja o caso, eu peço que acompanhe genuinamente os calculos e vou explicar o mais suscintamente que puder e talvez voce possa desenvolver certa facilidade. Não é nada extraordinariamente mais avancado do que uma aula de matematica normal, apenas sendo "aplicado".

## What about english? 

Yea, my previous text were in english, and I plan to translate this one to english too, so wait for it, or ... google translate this one. But .. there is already plenty material, which will be quoted at the end of this text so you can have some sources of your own.


## Let's get... ops.. Vamos começar!!


![Screen representation](/images/rasterizer/sistema-equacoes.pdf)
