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
Multiplicar um vetor por um numero é multiplicar as componentes vetor $$\vec{v} = (2, 2)\dot3 = (6,6)$$. Chamamos o numero multiplicado de `escalar`. E realmente passa a ideai de "esticar" o vetor em uma multiplicação por um valor $$>1 $$ e de "encolher" caso multiplicamos por $$ < 1$$.
Multiplicar dois vetores é um pouco mais complicado. Então vamos abordar no futuro.

Então temos cada vértice o nosso cubo é dado por um vetor. Queremos então encontrar uma forma de rotacionar os pontos do cubo (nossos vetores), esticá-los e, por fim, move-los.

Vamos começar com  "estica-los". Como vimos acima, para "escalar" um vetor, basta multiplicar pelo valor de escala. Poderíamos então com a nossa instancia, "multiplicar" todos os vértices por um valor de escala. E para mover bastaria somar com o vetor de posição do nosso cubo. O problema começa a aparecer ai. Seriam muitas contas que teríamos que deixar explicitas e nosso código começaria a ficar muito complexo e difícil de acompanhar.
E se pudéssemos fazer algo como: se temos um vértice $$V$$ $$V' = T_{ranslacao} \dot R_{otacao} \dot E_{scala} \dot V$$ e $$V'$$ seria o vetor que queríamos? Poderíamos usar as mesmas operações em todos os vértices!

#### everything is a matrix neo

Então finalmente chegamos na citação do Morpheus no filme matria. Felizmente, existem essas ferramentas na matemática : matrizes.
OBS: [Aqui temos um link](https://matematicabasica.net/matrizes/) para caso você não seja familiar com o básico das operações em matrizes ou precise revisar!

Podemos representar um vetor bidimensional como uma matriz $$2 \times 1$$, ou seja, nosso vetor $$\vec{v} = \begin{bmatrix} 2 \\ 2 \end{bmatrix}$$. E então se multiplicarmos uma matriz pelo nosso vetor, vamos transformar nosso vetor! Mas lembrando de algumas propriedades básicas de matrizes: se quisermos obter um vetor de volta, ou seja, uma matriz de forma $$2 \times 1$$, teremos que multiplicar por uma matriz $$ 2 \times 2$$.

Então vamos ver como podemos chegar em uma matriz de "escala":

![Cena](/images/rasterizer/descricao-cena/d-cena-03.jpg)

Na imagem acima colocamos nosso vetor $$ \begin{bmatrix} 2 \\ 2 \end{bmatrix}  \times \begin{bmatrix} i & j \end{bmatrix}$$ , o que isso significa 🤔?

Pra entender a imagem acima pensem que os eixos também são vetores:

![Cena](/images/rasterizer/descricao-cena/d-cena-04-01.jpg)

E então os eixos são múltiplos de ambos os vetores $$\vec{i}$$ e $$\vec{j}$$.

Agora vem a magia das matrizes: As transformações nos vetores multiplicados pela matriz vão ser "como $$\vec{i}$$ e $$\vec{j}$$ se transformam".
No exemplo anterior, chegamos em que a matriz para escalar um vetor é $$ \begin{bmatrix} x & 0 \\ 0 & x\end{bmatrix}$$. Em outras palavras é a matriz em que pegamos $$ i = (1, 0) \dot x$$ e $$j = (0, 1) \dot x$$ e $$x$$ é o nosso valor de escala! Quando multiplicamos o nosso vetor por essa matriz, nosso vetor escala igualmente os vetores $$\vec{i}$$ e $$\vec{j}$$! 😮‍💨

Com tudo isso dito vamos ver como podemos rotacionar um vetor.

![Cena](/images/rasterizer/descricao-cena/d-cena-04-02.jpg)

Para rotacionar um vetor $$\vec{v}$$, queremos então rotacionar os vetores $$\vec{i}$$ e $$\vec{j}$$. Como eles são os nossos eixos queremos manter que eles continuem perpendiculares entre si. Então queremos rotacionar os dois a mesma quantia.

Vamos começar pensando como rotacionar o vetor $$\vec{i}$$. E então rotacionaremos o vetor $$\vec{j}$$.
Se quisermos rotacionar $$\vec{i}$$ uma quantia $$\theta$$, podemos usar trigonometria para saber a sua posição. Sabemos que o seu comprimento não muda. E pelas propriedades de trigonometria sua posição em $$y$$ vai ser o $$\sin \theta$$, pois a hipotenusa é o comprimento do nosso vetor (que não mudou de valor $$= 1$$). E o valor em $$x$$ será o $$\cos \theta$$ pela mesma razão.

![Cena](/images/rasterizer/descricao-cena/d-cena-04-03.jpg)

Então o nosso vetor $$\vec{i}$$ dada uma rotação $$\theta$$, irá terminar em $$(\cos \theta, \sin \theta)$$. Ou em notação de matriz: $$\begin{bmatrix} \cos \theta  \\ \sin \theta \end{bmatrix}$$.

Para rotacionar o vetor $$j$$ temos que usar um pouquinho mais de geometria. Pois $$\theta$$ é o angulo entre $$i$$ e $$i'$$. Queremos então qual o angulo $$\alpha$$ que o vetor $$j$$ e onde $$j
 $$ formam com o eixo horizontal apos a rotação.  Sabemos que $$i$$ e $$j$$ são complementares, isto é, juntos somam $$90º$$. Então sabemos que $$\alpha + \theta = \frac{\pi}{2} = 90º$$. Então rotacionamos $$j$$ por $$\alpha$$ vamos ter $$ j' = (-\cos \alpha, \sin \alpha)$$, pelas mesmas propriedades trigonométricas que vimos para o vetor $$i$$. Mas queremos esse vetor em relação ao angulo $$\theta$$. Temos que $$\alpha = \frac{\pi}{2} - \theta $$ e sabemos que: $$\sin$$ de um angulo é igual ao $$\cos$$ de seu complementar. Por fim então temos: $$\begin{bmatrix} -\sin \theta \\ \cos \theta \end{bmatrix} $$ como a matriz para o vetor $$j$$.

![Cena](/images/rasterizer/descricao-cena/d-cena-05.jpg)

Com isso temos finalmente a matriz de rotação bidimensional : $$\begin{bmatrix} \cos \theta & \sin \theta \\ -\sin \theta & \cos \theta \end{bmatrix}$$.

Vamos ver se conseguimos rotacionar um vetor $$(3,1)$$ $$30º$$ em relação ao eixo horizontal.

![Cena](/images/rasterizer/descricao-cena/d-cena-05-1.jpg)

Por fim vamos ver como podemos chegar em uma matriz para mover um vetor. É só pensar que queremos uma matriz $$\begin{bmatrix}A & B \\ C & D \end{bmatrix}$$ que quando multiplicamos por um vetor $$\vec{v}$$, essa matriz some em $$\vec{v}$$ alguma quantia em $$vec{v} = (x+T_x, y+T_y)$$. Então se fizermos esse produto, vamos chegar em um sistema de equações. Vamos ver como uma dessas equações do sistema vai ficar: $$Ax + By = T_x + x$$. Como precisamos de $$x$$, logo $$A$$ pode ser $$1$$, portanto $$By = T_x$$.

![Cena](/images/rasterizer/descricao-cena/d-cena-05-2-01.jpg)

Então disso temos que o valor $$B = \frac{T_x}{y}$$. E similarmente, temos que $$C = \frac{T_y}{x}$$. Então nossa matriz de translado é $$ = \begin{bmatrix} 1 & \frac{T_x}{y} \\ \frac{T_y}{x} & 1 \end{bmatrix}$$.

![Cena](/images/rasterizer/descricao-cena/d-cena-05-2-02.jpg)

Então finalmente temos que as nossas matrizes de transformação para vetores bidimensionais são as seguintes:

![Cena](/images/rasterizer/descricao-cena/d-cena-05-3.jpg)

😮‍💨 Depois de tanta coisa temos que pensar "sera que a ordem dessas transformações importa"? E a resposta é: sim!
Veja, se rotacionamos um quadrado na origem, e depois o movemos é diferente de movermos um quadrado e depois rotacionamos:

![Cena](/images/rasterizer/descricao-cena/d-cena-06.jpg)

Então pensando que vamos girar algo sempre em relação à origem, portanto é melhor começarmos escalando ja que não altera os pontos, apenas "os estica". Depois podemos então rotacionar e por fim, mover. Se sempre usar-mos essa ordem, sempre as transformações serão como a gente espera : `escalar -> rotacao  -> mover`.

Com tudo isso dito esta na hora de voltarmos para as três dimensões!

## Estendendo para três dimensões

Então temos o nosso cubo no espaço do objeto. Temos a sua instancia que agora possui uma propriedade que nos diz sua `rotação`, `escala` e `posição` na `instancia` desse cubo no espaço de cena. Então relembrando o que queremos fazer é: pegar os vértices do nosso cubo, leva-los para o espaço de cena, projetar os vértices em cena no plano da câmera e por fim com os pontos da câmera, conectar os pontos como triângulos e desenha-los na tela. E agora temos matrizes para representar todas essas transformações da seguinte forma: para um vértice $$V$$ do cubo, o ponto $$P'$$ projetado vai ser: $$P'= P_{rojeção} \dot T_{transladar} \dot R_{rotacionar} \dot E_{scalar} \dot V $$. Sendo que a matriz de $$P_{rojeção}$$ a matriz que leva o ponto da cena para o espaço de projeção! E obter a nossa matriz de projeção é bem fácil depois de entendermos como funciona para projetar um ponto como vimos no post anterior.

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
