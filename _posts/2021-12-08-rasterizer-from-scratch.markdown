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


## Começando do começo: como desenhar uma linha ?
"Dê-me uma alavanca e um ponto de apoio e eu moverei o mundo" essa frase de Arquimedes poderia ser facilmente aplicada para a computação grafica: "Dê-me uma função de desenhar retas e eu irei desenhar qualquer forma". A ideia por tras disso é que se pudermos desenhar livremente linhas com o controle fino que quisermos, podemos decompor qualquer figura em desenho de linhas.
Então espero ter justificado o porque dos proximos paragrafos e com esse argumento espero que acompanhe sem muita reclamação e tédio os proximos paragrafos que estão vindo.

#### um pouquinho de matematica

Vamos imaginar que queremos desenhar uma reta no plano entre dois pontos. 
![Representacao da tela](/images/raytracing-scratch/screen_representation.png)
A tela de um computador (como vista no texto de raytracing) é representada como a imagem acima: (eixo $$x$$ cresce para direita, e o eixo $$y$$ cresce para baixo.

Então vamos imaginar como vamos desenhar um ponto na tela usando este tipo de coordenada
![Screen representation](/images/rasterizer/reta-no-plano-1.jpg)

Então como na imagem acima temos $$P_0$$ e queremos desenhar uma linha até $$P_1$$. Podemos pensar que podemos pegar qual a direção para o $$P_1$$ à partir de $$P_0$$ e pintar cada pixel naquela direção e entao, fazemos isso até chegar em $$P_1$$.
![Screen representation](/images/rasterizer/sistema-equacoes-1.jpg)



![Screen representation](/images/rasterizer/angulo-mensura-1.jpg)
![Screen representation](/images/rasterizer/valor_do_y-1.jpg)
![Screen representation](/images/rasterizer/encontrando-constante-1.jpg)
![Screen representation](/images/rasterizer/final-equacao-reta-1.jpg)
![Screen representation](/images/rasterizer/exemplo1-cropped-1.jpg)

