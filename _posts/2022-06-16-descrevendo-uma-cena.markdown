---
layout: post
title:  " 'The Matrix is everywhere. It is all around us. Even now in this very room', Morpheus - Como fazer uma maquina entender as três dimensões "
date:   2022-06-16 12:28:05 -0300
categories: rasterizer
---

Chegamos finalmente em como vamos representar uma cena tridimensional. Infelizmente vamos ser obrigados a usar um pouco mais de matemática porque vamos precisar fazer a maquina entender tanto os pontos tridimensionais quanto se quisermos mover, esticar ou girar algum ponto precisamos de alguma forma de dizer para o computador como faze-lo. Talvez este seja o texto mais carregado de matemática mas fiquem tranquilos que eu vou tentar ajudar você leitor a ir do porto da ignorância chegar até a baia tridimensional atravessando você o oceano que te separa. Mas temos que lembrar: "mar tranquilo não faz bom marinheiro!"

No post anterior vimos como desenhar um objeto tridimensional com perspectiva, dada uma representação de uma figura tridimensional. Apresentamos apenas a matemática por trás da ideia. Para irmos além aquele método apresenta alguns problemas:
* Não conseguimos desenhar qualquer objeto tridimensional com o método, por exemplo, esferas. Pois o algoritmo depende de decompor em linhas
* Toda vez que fossemos criar um objeto em cena, precisaríamos dizer qual a ordem dos desenhos de cada aresta. E não só isso: A câmera precisa ficar estacionada em $$(0,0,0)$$.
* Se fossemos criar outro cubo, repetiríamos todo o cubo, porem, movendo cada aresta 😩

Então pensando nestes problemas vamos criar uma forma melhor de descrever os objetos tridimensionais e como podemos criar abstrações para desenha-los na tela.

# Descrevendo a cena tridimensional

Ok, vamos bolar algum jeito de resolver os problemas citados.
Vamos começar em: como podemos desenhar qualquer figura tridimensional usando a nossa técnica de projeção.

No exemplo anterior para desenhar um cubo nós desenhamos aresta por aresta. Isso é um pouco limitante porque teríamos que saber como reduzir todas as figuras em retas.
Para contornar isso, e automatizar nosso algoritmo para desenharmos qualquer coisa com a mesma equação de projeção que chegamos anteriormente, podemos pensar em reduzir todas as formas em figuras mais simples!

![malha de um coelho](/images/rasterizer/descricao-cena/rabbit_mesh.png)

Então e se reduzirmos tudo à triângulos? Triângulos são simples de representar e desenhar. São os polígonos mais simples e todos os pontos estão sempre no mesmo plano! [Aqui tem um ótima descrição](https://www.youtube.com/watch?v=KdyvizaygyY) do porque triângulos são excelentes polígonos para reduzir qualquer figura tridimensional. Infelizmente o video é em inglês.

![Cena](/images/rasterizer/descricao-cena/d-cena-01.jpg)

Se decompormos nossas figuras em triângulos precisamos apenas saber quais sao os pontos e como ligar os pontos. No nosso cubo teríamos na face $$ABCD$$ os triângulos: $$ABD$$ e $$BCD$$. Podemos então fazer a seguinte ideia:

```
triangulo:
  | tupla( vertice1, vertice2, vertice3)

modelo:
  | vertices: lista ( tupla (x, y, z))
  | faces: lista( triangulo  )
```

E então para desenhar qualquer figura descrita dessa forma teríamos :

```
função desenha_objeto(objeto)
  para cada face em faces(objeto):
    para cada triangulo em face:
      desenha_triangulo(triangulo)

função desenha_triangulo(triangulo):
  // linha p1-p2
  desenhe_linha(
    projeção->tela(
      mundo->projeção(vértice1)
    ),
    projeção->tela(
      mundo->projeção(vértice2)
    ),
  )

  // linha p2-p3
  desenhe_linha(
    projeção->tela(
      mundo->projeção(vértice2)
    ),
    projeção->tela(
      mundo->projeção(vértice3)
    ),
  )

  // linha p3-p1
  desenhe_linha(
    projeção->tela(
      mundo->projeção(vértice3)
    ),
    projeção->tela(
      mundo->projeção(vértice1)
    ),
  )
```


O cubo foi definido seus vértices em relação a origem. Vamos chamar esse eixo $$x y z$$ de o espaço do cubo. Nesse espaço tem apenas todos os vértices do cubo.
Agora imagine que temos o eixo $$x y z $$ da nossa cena. E nela imagine que temos um cubo a uma distancia de $$4$$ unidades da nossa câmera, no eixo $$z$$.

![Cena](/images/rasterizer/descricao-cena/d-cena-02.jpg)

Dizemos que este espaço é o espaço da cena. Mas como vamos levar as coordenadas do nosso cubo para as coordenadas do mundo? 🤔
Se a nossa câmera está na origem $$(0,0,0)$$, o nosso cubo está em $$(0,0,4)$$. Então no nosso espaço da cena só precisamos levar os vértices do nosso cubo para essa posição. Se nós somar-mos todas as coordenadas do nosso cubo $$(-1, 1, -1) + (0, 0, 4) = (-1, 1, 3) ...$$ teremos todos os nossos vértices do cubo movidos para a coordenada do espaço da cena.

Vamos usar essa ideia para iniciar nossa modelagem! Queremos então separar um modelo de objeto de sua instancia. Vamos chamar de instancia o que estiver na nossa cena. E modelo o objeto com seus pontos em seu espaço de objeto. Podemos chegar na seguinte ideia:

```
modelo:
  | vertices: lista( tupla(x, y, z) )
  | faces: lista ( tupla(A,B,C) )

instancia:
  | modelo: modelo
  | posicao_cena: (x, y, z)

cubo_em_cena -> instancia:
  | modelo: cubo
  | posicao_cena: (0, 0, 4)
```

Então nessa nossa descrição atual o que faríamos seria a nossa `instancia`, teria uma `posicao_cena = (0, 0, 4)` que somaria em todos os vértices do `modelo` do cubo a posição em cena. Dessa forma conseguimos ter quantas instancias de cubos quisermos e na posição que quisermos.

Mas... 🤔 como podemos girar, escalar? Vamos precisar de transformações.

# Entendendo transformações

Esta parte do texto é onde eu vou explicar como vamos fazer para transformar a posição dos objetos em cena. Vai ser uma introdução alguns conceitos matemáticos de uma area chamada "álgebra linear". Se quiser, pode só pular este capitulo e seguir para o próximo, onde vamos apenas usar essas estruturas 🤷. Apesar de poder ignorar e só usar "como funciona" é possível mas vai ser difícil de entender como tudo funciona.

Vamos começar explicando como as transformações em 2D funcionam. Assim que entendemos elas, vamos aumentar para trés dimensões!

Um conceito inicial são vetores. Vetores em duas dimensões são as coordenadas $$(x, y)$$ de um ponto no plano. O ponto $$(2, 2)$$ é o vetor $$\vec{v} = (2, 2)$$ em que sua $$x$$-coordenada$$=2$$ e sua $$y$$-coordenada$$=2$$.
A soma e a subtração de vetores é a soma de suas coordenadas. Então a soma de $$\vec{v} + (1,2) = (3, 4)$$.
Multiplicar um vetor por um numero é multiplicar as componentes vetor $$\vec{v} = (2, 2)*3 = (6,6)$$. Chamamos o numero multiplicado de `escalar`. E realmente passa a ideai de "esticar" o vetor em uma multiplicação por um valor $$>1 $$ e de "encolher" caso multiplicamos por $$ < 1$$.
Multiplicar dois vetores é um pouco mais complicado. Então vamos abordar no futuro.

Então temos cada vértice o nosso cubo é dado por um vetor. Queremos então encontrar uma forma de rotacionar os pontos do cubo (nossos vetores), esticá-los e, por fim, move-los.

Vamos começar com  "estica-los". Como vimos acima, para "escalar" um vetor, basta multiplicar pelo valor de escala. Poderíamos então com a nossa instancia, "multiplicar" todos os vértices por um valor de escala. E para mover bastaria somar com o vetor de posição do nosso cubo. O problema começa a aparecer ai. Seriam muitas contas que teríamos que deixar explicitas e nosso código começaria a ficar muito complexo e difícil de acompanhar.
E se pudéssemos fazer algo como: se temos um vértice $$V$$ $$V' = T_{ranslacao} * R_{otacao} * E_{scala} * V$$ e $$V'$$ seria o vetor que queríamos? Poderíamos usar as mesmas operações em todos os vértices!

#### everything is a matrix neo

Então finalmente chegamos na citação do Morpheus no filme matria. Felizmente, existem essas ferramentas na matemática : matrizes.
OBS: [Aqui temos um link](https://matematicabasica.net/matrizes/) para caso você não seja familiar com o básico das operações em matrizes ou precise revisar!

Podemos representar um vetor bidimensional como uma matriz $$2 \times 1$$, ou seja, nosso vetor $$\vec{v} = \begin{bmatrix} 2 \\ 2 \end{bmatrix}$$. E então se multiplicarmos uma matriz pelo nosso vetor, vamos transformar nosso vetor! Mas lembrando de algumas propriedades básicas de matrizes: se quisermos obter um vetor de volta, ou seja, uma matriz de forma $$2 \times 1$$, teremos que multiplicar por uma matriz $$ 2 \times 2$$.

Então vamos ver como podemos chegar em uma matriz de "escala":

![Cena](/images/rasterizer/descricao-cena/d-cena-03.jpg)

Na imagem acima colocamos nosso vetor $$ \begin{bmatrix} 2 \\ 2 \end{bmatrix}  \times \begin{bmatrix} i & j \end{bmatrix}$$ , o que isso significa 🤔?

Pra entender a imagem acima pensem que os eixos também são vetores:

![Cena](/images/rasterizer/descricao-cena/d-cena-04-01.jpg)

E então os eixos são múltiplos de ambos os vetores $$i$$ e $$j$$.

Agora vem a magia das matrizes: As transformações nos vetores multiplicados pela matriz vão ser "como $$i$$ e $$j$$ se transformam".
No exemplo anterior, chegamos em que a matriz para escalar um vetor é $$ \begin{bmatrix} x & 0 & \\ 0 & x\end{bmatrix}$$. Em outras palavras é a matriz em que pegamos $$ i = (1, 0) * x$$ e $$j = (0, 1) * x$$ e $$x$$ é o nosso valor de escala! Quando multiplicamos o nosso vetor por essa matriz, nosso vetor escala igualmente os vetores $$i$$ e $$j$$! 😮‍💨

Com tudo isso dito vamos ver como podemos rotacionar um vetor.

![Cena](/images/rasterizer/descricao-cena/d-cena-04-02.jpg)

Para rotacionar um vetor $$\vec{v}$$, queremos então rotacionar os vetores $$i$$ e $$j$$. Como eles são os nossos eixos queremos manter que eles continuem perpendiculares entre si. Então queremos rotacionar os dois a mesma quantia.

Vamos começar pensando como rotacionar o vetor $$i$$. E então rotacionaremos o vetor $$j$$.
Se quisermos rotacionar $$i$$ uma quantia $$\theta$$, podemos usar trigonometria para saber a sua posição. Sabemos que o seu comprimento não muda. E pelas propriedades de trigonometria sua posição em $$y$$ vai ser o $$\sin \theta$$, pois a hipotenusa é o comprimento do nosso vetor (que não mudou de valor $$= 1$$). E o valor em $$x$$ será o $$\cos \theta$$ pela mesma razão.

![Cena](/images/rasterizer/descricao-cena/d-cena-04-03.jpg)



![Cena](/images/rasterizer/descricao-cena/d-cena-05.jpg)

![Cena](/images/rasterizer/descricao-cena/d-cena-05-1.jpg)

![Cena](/images/rasterizer/descricao-cena/d-cena-05-2.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-05-3.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-06.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-07.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-08.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-09.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-10.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-11.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-12.jpg)

<!-- $$

\begin{equation*}
A_{m,n} =
\begin{pmatrix}
a_{1,1} & a_{1,2} & \cdots & a_{1,n} \\
a_{2,1} & a_{2,2} & \cdots & a_{2,n} \\
\vdots  & \vdots  & \ddots & \vdots  \\
a_{m,1} & a_{m,2} & \cdots & a_{m,n}
\end{pmatrix}
\end{equation*}

$$ -->
