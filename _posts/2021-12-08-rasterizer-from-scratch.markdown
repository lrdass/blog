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
Representando esta ideia matematicamente queremos dizer que um ponto $$P$$ na reta entre $$P_0$$ e $$P_1$$ vai ser igual à $$ P = P_0 + \vec{v} * t$$ onde $$t$$ vai ser um numero qualquer. Ou seja, se $$t = 0$$, $$P$$ vai ser igual a $$P_0$$. Se $$t=1$$, então $$P$$ vai ser igual $$P_1$$. Então modelamos uma equação que modela essa reta entre os dois pontos porem $$t$$ tem que estar entre $$ 0 e 1$$.
![Screen representation](/images/rasterizer/exemplo1-cropped-1.jpg)
Na imagem acima vemos um exemplo de como usamos esta equação que modelamos para encontrar um ponto na reta. Fizemos $$t = 0.5$$ e encontramos um ponto na reta $$l$$ em que $$P = (5.5, 5.5)$$.
Porem como podemos fazer para encontrar os pixels na tela? Vamos lembrar que o pixel é "discreto". Quando digo "discreto" digo que é um valor "inteiro", ou seja, o pixel $$(5.5, 5.5)$$ não existe na tela, apenas o pixel $$(5,5)$$. Então se fizessemos uma função como iterar entre 0 e 1 e incrementar $$0.01$$,  Iterariamos mil vezes e repetiriamos muitos valores: Todos valores entre $$5.001$$ e $$5.599$$ seriam o mesmo pixel. Talvez não pareça tão ruim agora mas imagine que vamos usar esta mesma função para preencher triangulos e no futuro cada poligono tridimensional vai ter milhares de triangulos, então ja imagine o quanto essa função vai fazer o computador trabalhar atoa.


_OBS: Se você é um programador de primeira viagem, recomendo a leitura do texto [Why early optimization is the root of all evil](https://stackify.com/premature-optimization-evil/) em que o autor alerta sobre optimização prematura do código. O que estamos fazendo aqui pode ser um exemplo de optimização prematura ja que antes mesmo de acontecer o problema de custo computacional ja estamos corrigindo ele. Porem, estou me atendo a este ponto agora pois acho didatico lidar com a ideia do algoritmo de desenho de linhas e deixar este problema fora de vista para os problemas que virão futuramente!_


Então vamos tentar melhorar nossa equação. Queremos saber apenas os pontos que estão na reta ( o que nossa equação atualmente ja nos oferece), porem, queremos apenas as coordenadas _"discretas"_. E alem disso, queremos fazer o minimo de iteracoes possiveis. De preferencia, pra cada valor de $$x$$ a equação retorne um valor de $$y$$ ou vice-versa. Como podemos fazer isso ?? 

Então vamos estender um pouco nossa equação. Sabemos que $$P = (x,y)$$, ou seja, um ponto é um conjunto de coordenadas no plano $$x,y$$.
![Screen representation](/images/rasterizer/sistema-equacoes-1.jpg)
Decompomos então a nossa equação em $$(x,y) = (x_0, y_0) + t * ( x_1 - x_0 , y_1 - y_0)$$. O motivo dessa subtração é que para encontrar a direção de um ponto para o outro _(chamamos essa direção de vetor)_ fazemos $$ponto Final - ponto Inicial$$ e isto nos dá o "vetor" que aponta do ponto inicial para o ponto final.

E então, com a nossa equação decomposta em $$(x,y)$$, vamos separar por variavel e separaramos em um sistema de equações. $$ x = x_0 + t (x_1 - x_0)$$ e similar para $$y$$.
Vamos isolar então a unica variavel em comum às duas equações $$t$$. E então vamos substituir o que encontrar-mos como valor de $$t$$ na segunda equação. Assim vamos chegar em apenas uma equação com as duas variaveis. Lembrando que o nosso objetivo é chegar em uma equação que nos dê o valor de $$y$$ para cada $$x$$.
![Screen representation](/images/rasterizer/angulo-mensura-1.jpg)
Isolando o $$t$$ encontramos que $$t = \dfrac{x - x_0}{x_1 - x_0}$$
![Screen representation](/images/rasterizer/valor_do_y-1.jpg)
Fazendo a substituição do nosso valor de $$t$$ na equação de $$y$$ encontramos que $$ y = y_0 + \dfrac{x-x_0}{x_1 - x_0} * (y_1 - y_0)$$
![Screen representation](/images/rasterizer/encontrando-constante-1.jpg)
![Screen representation](/images/rasterizer/final-equacao-reta-1.jpg)

