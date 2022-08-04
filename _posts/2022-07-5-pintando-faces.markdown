---
layout: post
title:  "'O mundo é minha representação' - Schopenhauer; Preencher as faces dos triangulos é a primeira parte do realismo"
date:   2022-07-19 12:28:05 -0300
categories: rasterizer
tags: rasterizer face-occlusion
---

![banda KLF](/images/rasterizer/preenchimento/the_klf.jpg)

Em 1984 a banda KLF viajava pela Inglaterra fazendo exibições salas abertas de cinema queimando 1 milhão de libras. Naquela época 1 milhão de libras simbolizava a fuga da "vida cotidiana" de lutar pelo ganha pão, simbolizava a entrada em uma classe social em que não mais precisava "ganhar o pao de cada dia", mas que o dinheiro podia render e, portanto, viver de renda. Era um valor simbólico que a banda havia queimado. O cinegrafista e amigo da dupla, não entendia muito bem o porque eles estavam fazendo e, os próprios membros alegaram que, durante o ato, nem eles também sabiam porque estavam fazendo.

Nos anos 90 a musica havia se tornado uma industria, e segundo Drummond and Cauty, a alma da musica havia sido vendida pelo mesmo peso em ouro. Então, no começo da era digital e nos primórdios dos sons sintetizados em computador, os dois tiveram uma brilhante ideia: E se fizessem uma musica pop em que não pudesse ser comercializada? Fizeram uma musica chamada _The Queen and I_, que criticava a democracia Inglesa e usava samples de uma musica do ABBA. A musica ganhou popularidade e com a mesma velocidade em que ganhou o publico recebeu igualmente em processos. Era genial. Na época ainda se chamavam the Jams. Acontece que a historia da vitoria da dupla Drummond e Cauty sobre o capitalismo musical virou contra eles.

KLF inovando com mais musicas digitais e iniciando gêneros musicais, ainda com a veia punk de rebelar contra a industria musical, começaram a fazer sucesso e o próprio sucesso deles era o que os levaria a queimar os 1 milhão de libras. No meio do sucesso, eles perceberam que a industria havia se adaptado, e agora os samples, que antes geravam processos, agora eram vastamente usados. A industria da musica havia se adaptado e Cauty e Drummond eram os responsáveis. No meio da fama e com riqueza e influencia que conquistaram justamente pela mesma industria que queriam destruir, queimaram os 1 milhão de libras, como protesto: Se dessem para alguma ONG, ou para alguém, o dinheiro ainda existiria e ainda continuaria existindo e tendo influencia. E portanto, na visão deles, o único jeito de eles se libertarem era queimando.

Cauty e Drummond desfizeram a banda mas seguiram suas carreiras artísticas. Ainda como verdadeiros punks. Ao se tornarem milionários, disseram que venderam sua alma para o capitalismo. E queimar, foi a sua forma de recomprar sua alma de volta, e junto dela, sua expressão artística.

A história do KLF beira o que é real e o irreal. E quando não há como definir se algo é real ou não sobra apenas os símbolos do universo que nos cerca e como interagimos com eles depende das varias formas como nós interpretamos eles. Quanto mais melhoramos o nosso rasterizador mais nos aproximamos da dificuldade de discernir o real do irreal. E este texto vai tratar da primeira parte de como vamos "dar realidade" aos objetos. Toda a parte que tratamos até agora apenas lidou com a representação e projeção. Mas o que da o realismo é como "preenchemos" os triângulos em cada um dos nossos objetos. Cada pixel deve receber a cor certa para atingirmos o realismo.

Neste texto vamos construir nosso algoritmo que finalmente vai rasterizar os triângulos que compõe nossa cena. Rasterizar é o ator de preencher os triângulos. Então precisamos elaborar um algoritmo que consiga preencher qualquer triangulo independente da sua orientação. Mas só preencher não será suficiente. Vamos elaborar algum algoritmo para saber a ordem em que desenhamos estes triângulos, pois, depois que projetarmos, há faces que não serão visíveis.

# Como vamos preencher nossos modelos ?

Para preencher nosso modelo precisamos preencher todas as faces com as cores específicas. Neste texto vamos discutir primeiro como podemos preencher as faces dos triângulos. Nos próximos vamos ver como podemos preencher esses triângulos com cores específicas para reproduzirmos efeitos de iluminação e textura. Mas por enquanto, vamos nos conter a preencher as faces.

Então queremos pensar em um algoritmo para preenchera as faces dos triângulos. Depois que conseguirmos ainda vai acontecer um fenômeno: os triângulos vao ser coloridos pela ordem que foram definidos. Então precisamos pensar em alguma forma auxiliar para colorir os triângulos que estão mais próximos da câmera somente.

![Cube](/images/rasterizer/preenchimento/facefilling-000.jpg)

Para preencher triângulos existem vários algoritmos conhecidos. O que vamos usar aqui inicialmente vamos usar a mesma ideia por trás de como desenhamos linhas no nosso primeiro texto. Nós precisamos saber quais são as equações de reta entre os vértices dos triângulos e isso vai permitir nós sabermos quais os pontos estão nas arestas do triangulo. Com essa aresta, se nos iterarmos pela altura do triangulo, para preencher o triangulo vai bastar desenhar uma linha de aresta em aresta para cada valor da altura do triangulo.


{% include pseudocode.html id="3" code="
\begin{algorithm}
\caption{PrencherTriangulo, onde $V_1, V_2, V_3$ são os vértices de um triangulo}
\begin{algorithmic}
\PROCEDURE{PreencherTriangulo}{$V_1, V_2, V_3$}
  \STATE $V_1, V_2, V_3$ $\leftarrow$ \CALL{Ordenar}{$V_1.y, V_2.y, V_3.y$}
  \FOR{$V_1$ \TO $V_3$}
    \STATE{Computar $x$-coordenada das arestas para o atual $y$}
    \STATE{Pinte o pixel entre $x'$ e $x''$ }
  \ENDFOR
\ENDPROCEDURE
\end{algorithmic}
\end{algorithm}
" %}

E ai vai bastar que a gente consiga controlar qual face vai ser desenhada. Existindo a técnica do pintor: O pintor quando vai produzir seus quadros primeiro desenha o fundo, depois o que ta um pouco a frente do fundo e por fim o que está mais próximo. Podemos usar este algoritmo. O problema é que existem figuras que o algoritmo do pintor ainda não vai conseguir resolver. Então uma melhoria no algoritmo do pintor seria que ao invés de pintar triangulo por triangulo dada a profundidade, pintarmos um pixel por profundidade. Então sempre coloríamos o pixel com a $$z$$-coordenada mais próxima da câmera.

![Cube](/images/rasterizer/preenchimento/facefilling-001.jpg)

Por fim, há portanto de se pensar que existem inúmeras faces do nosso modelo que nunca seriam vistas, e de toda forma, estariam sendo pintadas com o algorismo do pintor. Então para melhorar a eficiência, poderíamos saber quais sao as faces que vao ser pintadas e remover as que nao serão. Sendo este algoritmo chamado de `face culling`. Ao combinarmos estes algoritmos vamos conseguir visualizar nossos modelos tridimensionais propriamente coloridos!

![Cube](/images/rasterizer/preenchimento/facefilling-002.jpg)

Então vamos pensar em como podemos preencher um triangulo. Uma ideia que temos que fixar ja desde o começo é que nossa tela de pixels é discreta. Isto é: todos os indices dos pixels são valores inteiros. Não existe um pixel $$3.4$$ ou $$1.15$$. Então temos que desde ja pensarmos que qualquer valor racional deve ser convertido para um inteiro.

Então vamos ver como podemos chegar no algoritmo para desenhar nosso triangulo. Vimos acima a ideia por tras. Agora vamos ver como podemos implementa-la. Então imagine que temos um triangulo com os vértices $$A (2, 5)$$ $$B (-4, -3)$$ e $$C (5, -3)$$. _OBS: Apenas para relembrar que no primeiro texto e no texto de projeção, nós centralizamos as coordenadas dos pixels da tela para que pudéssemos mapear a nossa tela de projeção _ .
Como vamos iterar sobre o eixo-$$y$$, queremos saber quais são os valores de $$x$$ para cada valor de $$y$$. E para nossa sorte, assim como vimos no primeiro post, podemos usar equações de reta entre dois pontos para determinar a equação linear que conecta os dois pontos. Quando tivermos esta equação, conseguiremos calcular o valor das arestas do triangulo dado uma $$y$$-coordenada. Vamos ver como isso vai funcionar:

![Cube](/images/rasterizer/preenchimento/facefilling-003.jpg)

Queremos então iterar sobre o intervalo do maior valor de $$y$$ dos vertices até o menor valor de $$y$$ dos vertices. No nosso exemplo acima, queremos ir de $$5$$ até $$-3$$.  Então temos as nossas retas entre $$\overline{AB} \rightarrow y = \frac{4x}{3} + \frac{7}{3}$$ e temos que a nossa reta $$\overline{AC} \rightarrow y = - \frac{8x}{3} + \frac{31}{3}$$, e  conseguimos calcular alguns valores de $$x$$ para cada valor de $$y$$. E portanto, como podemos ver quando $$y=2$$ temos que $$x= - \frac{1}{4}$$ para a nossa reta $$\overline{AB}$$ e temos que $$x=\frac{25}{8}$$ para a reta $$\overline{AC}$$. A regra que usamos é arredondar para baixo  para o primeiro inteiro. Então temos que $$x = -1$$ para $$\overline{AB}$$ e $$x = 3$$ para $$\overline{AC}$$. Agora basta iterar entre $$-1$$ e $$3$$ e preencher cada pixel. E assim temos a base do nosso algoritmo.

![Cube](/images/rasterizer/preenchimento/facefilling-004.jpg)

#### casos específicos

![Cube](/images/rasterizer/preenchimento/facefilling-009.jpg)

Para iterar de aresta em aresta, vão existir casos como os triângulos acima em que não necessariamente só precisamos usar duas retas, mas as três retas. O triangulo $$ABC$$, possui o lado $$AB$$ maior que $$AC$$ e $$BC$$. Então quando formos iterar entre as arestas, algum momento iteraríamos sobre a aresta $$AC$$ até $$AB$$, e depois de $$CB$$ até $$AB$$.
Com isso em mente vamos conseguir agora preencher qualquer triangulo. Então vamos começar a elaborar nosso algoritmo.

Vamos precisar de alguma ferramenta para conseguirmos calcular as nossas equações de reta. Apesar de nos exemplos anteriores nós chegamos em um sistema de equações lineares bem simples para calcular as retas, resolver sistemas lineares para cada triangulo seria bastante complicado. Então vamos ver se conseguimos pensar em alguma ferramenta que possa nos ajudar.

O que precisamos? Queremos alguma forma de para cada $$y$$, encontrar um $$x$$ das arestas do triangulo. Então vamos assumir que temos uma função $$f(y)$$, que para cada $$y$$, retorna um $$x$$ da aresta do triangulo. Então quando a iteração for acontecer, teremos os valores de $$y$$ dos quais estamos iterando, mas precisamos calcular $$x$$. Então $$x$$ é uma variável dependente de $$y$$, e $$y$$, neste caso, é uma variável independente.

### Interpolação linear

Conseguimos então chegar que, haverá uma reta, da aresta do triangulo, que vamos querer encontrar um ponto $$P$$ entre os vértices do triangulo para um dado valor de $$y$$. Esta técnica é conhecida como interpolação linear, e vamos usar bastante essa técnica daqui em diante.

![Cube](/images/rasterizer/preenchimento/facefilling-005.jpg)
![Cube](/images/rasterizer/preenchimento/facefilling-006.jpg)
![Cube](/images/rasterizer/preenchimento/facefilling-007.jpg)

Na imagem acima, podemos visualizar o triangulo formado pelo vertices que queremos calcular a reta. Neste triangulo o lado oposto ao angulo $$\theta$$ é $$y_2 - y_1$$, e o angulo adjacente ao angulo é o lado $$x_2 - x_1$$. A razão do lado oposto pelo adjacente é a tangente do angulo $$\theta$$. Conseguimos perceber que o triangulo formado por $$P_1$$ $$P_2$$ é proporcional ao triangulo formado por $$P_1$$ e o ponto $$P$$ que procuramos. Então conseguimos chegar na seguinte equação:

$$
\frac{y_2 - y_1}{x_2 - x_1} = \tan \theta = \frac{y-y_1}{x-x_1}
$$

Dessa igualdade conseguimos isolar qual vai ser a nossa variável independe e qual vai ser a nossa variável dependente. No nosso algoritmo, vamos ter o valor de $$y$$, mas queremos saber qual o valor de $$x$$. Então, como dissemos acima, $$x$$ vai ser nossa variável dependente. Então vamos resolver essa igualdade para $$x$$.

$$ x = \frac{x_2 - x_1}{y_2 - y_1} \times (y - y_1) + x_1 $$

E podemos enxergar que essa equação realmente é uma equação de reta, da forma $$x = a(y-y_1) + x_1$$, ja que $$x_1$$ é uma constante, e $$a = \frac{y_2 - y_1}{x_2 - x_1} $$ também é .

Vamos testar e ver como essa equação funciona:

![Cube](/images/rasterizer/preenchimento/facefilling-008.jpg)

E agora podemos generalizar essa equação, porque não necessariamente só poderíamos esta equação da perspectiva de $$y$$ é independente e $$x$$ é dependente. Poderíamos usar a mesma equação em que os papeis são reversos: em que $$x$$ é independente e $$y$$ é dependente. Então vamos generalizar a equação. Seja $$i$$ a variavel independente e $$d$$ a variavel dependente:

$$
d = \frac{d_2 - d_2}{i_2 - i_1} * (i - i_1) + d_1
$$

Um pseudo algoritmo para nossa função de interpolação linear seria:

{% include pseudocode.html id="1" code="
\begin{algorithm}
\caption{LERP}
\begin{algorithmic}
\PROCEDURE{lerp}{$i_1, i_2, d_1, d_2$}
    \STATE $a = \frac{d_2 - d_1}{i_2 - i1}$
    \STATE $b = d_1$
    \FOR{$x = i_1$ \TO $i_2$}
      \RETURN $d = d + a$
    \ENDFOR
\ENDPROCEDURE
\end{algorithmic}
\end{algorithm}
" %}

## Vamos preencher as faces !

Com a nossa função de interpolação linear(também conhecida como `lerp`)em mãos, podemos agora nos concentrar em preencher as faces.
Então vamos esboçar o algoritmo. Para iterar em cada linha que compõe o triangulo, precisamos saber quais sao os vértices com as maiores $$y$$-coordenada. Então vamos ordenar os vértices e com o maior e o menos sabemos quais sao as linhas que vamos iterar.
Com cada linha, vamos usar a função de `lerp` e descobrir quais são as coordenadas de onde começa e termina cada aresta daquela linha. Então vamos iterar entre as arestas e vamos preencher os pixels.

Para lidar com os triângulos que citamos, podemos descobrir quais sao os dois menores lados do triangulo. Sabendo quais são, podemos junta-los e considerar que sao apenas um lado. E assim o algoritmo funciona da mesma forma.

E para finalizar, para iterarmos de aresta para aresta, temos que descobrir qual aresta tem o $$x$$-coordenada menor e qual tem a maior. E entao iteramos da menor para a maior colocando os pixels na dada coordenada.

{% include pseudocode.html id="4" code="
\begin{algorithm}
\caption{PrencherTriangulo}
\begin{algorithmic}
\PROCEDURE{PreencherTriangulo}{$V1, V2, V3$}
  \STATE $X_{valores}\overline{V1V2} = $ \CALL{LERP}{$V1.y, V2.y, V1.x, V2.x$}
  \STATE $X_{valores}\overline{V2V3} = $ \CALL{LERP}{$V2.y, V3.y, V2.x, V3.x$}
  \STATE $X_{valores}\overline{V1V3} = $ \CALL{LERP}{$V1.y, V3.y, V1.x, V3.x$}

  \STATE $X_{valores}\overline{V1V2V3}$ = $ X_{valores}V1V2 \cup X_{valores}V2V3 $
  \STATE pontoMédio = \CALL{size}{$X_{valores}V1V2V3$} $ \div 2$

  \IF{$X_{valores}V1V2V3[pontoMédio] > X_{valores}V1V3$}
    \STATE $x_{valor}AEsquerda$ = $X_{valores}V1V2V3$
    \STATE $x_{valor}ADireita$= $X_{valores}V1V3$
  \ELSE
    \STATE $x_{valor}ADireita$ = $X_{valores}V1V2V3$
    \STATE $x_{valor}AEsquerda$= $X_{valores}V1V3$
  \ENDIF

  \FOR{$V_1$ \TO $V3$ em $y$}
    \FOR{maisAEsquerda \TO maisADireita}
      \STATE \CALL{ponhaPixel}{x, y}
    \ENDFOR
  \ENDFOR

\ENDPROCEDURE
\end{algorithmic}
\end{algorithm}
" %}

O que estamos fazendo é portanto, calcular qual a aresta mais à esquerda e mais à direita e iterando sobre ela. Podemos tambem chamar `drawLine(xMaisAEsquerda, y, xMaisADireita,y)` no lugar do segundo `for` no nosso algoritmo. E agora conseguimos preencher as faces de um triangulo como podemos ver abaixo:


## Faces tridimensionais

Se usarmos este nosso recente algoritmo de preencher triangulos para preencher os triangulos das faces do cubo que chegamos no texto anterior, podemos obter um resultado parecido com esse:

![Cubo desenhado com as faces por ordem](/images/rasterizer/preenchimento/facefilling-fail1.png)
![Cubo desenhado errado](/images/rasterizer/preenchimento/facefilling-fail2.png)

E isso pode se dar pela a ordem em que os triângulos foram desenhados. Os triangulos do fundo do cubo estao sendo desenhados por ultimo, ou casos similares. Mas mesmo descrevendo a ordem "correta", a ordem ia depender do ponto de vista da camera. E se rotacionassemos o cubo novamente veriamos o poligono desenhado incorretamente. Para resolvermos este inconveniente, vamos criar uma ordem de pintura. E a solução é muito simples. Desenhamos o que esta mais longe primeiro, e o que esta mais perto da camera por ultimo. Assim sempre garantimos que a face da frente sempre esteja na frente.

Podemos ver qual triangulo tem a $$z$$-coordenada menor, e salvar qual foi a mais "proxima". Caso o novo triangulo esteja mais proximo, atualizamos este valor com o valor menor, e desenhamos este triangulo em frente. Este algoritmo chama-se [algoritmo do pintor](https://en.wikipedia.org/wiki/Painter%27s_algorithm). Podemos implementar ele facilmente apenas salvando qual a $$z$$-coordenada antes de "ignorar" este valor durante a projecão. Porem, acontece um problema com o algoritmo do pintor que queremos evitar desde já.

![Cube](/images/rasterizer/preenchimento/facefilling-010.jpg)

Caso alguma cena possua faces mais complexas, o algoritmo do pintor não produziria imagens corretas. Então pra isso, ao inves de saber qual a face esta mais a frente, vamos melhorar um pouco a precisao do algoritmo do pintor e, calcularemos entao, qual _pixel_ está mais a frente ao inves do triangulo inteiro. Para descobrir-mos isso, vamos usar a nossa função de `lerp`!
E para isso, nós estamos ainda iterando sobre o eixo $$y$$ do triangulo, de baixo para cima. Então nossa variavel $$y$$ é a nossa variavel independente. E queremos saber, para cada $$y$$, qual é o valor da $$z$$ coordenada respectiva daquela $$y$$-coordenada. E então, teremos um _buffer_, isto é, uma memoria para cada pixel da tela. E entao, para cada pixel vamos computar qual a distancia em $$z$$ da camera. Caso seja menor do que estava salvo no buffer para aquele pixel, atualizamos o buffer com o novo valor e pintamos aquele pixel. Do contrario, o pixel colorido ja é o mais proximo da camera.

Esta técnica é conhecida como [z-buffering](https://pt.wikipedia.org/wiki/Z-buffer).

Vamos precisar interpolar em $$z$$ para cada $$y$$ pois o triangulo pode ter alguma rotação em algum eixo.

Imaginando o nosso cubo de exemplo do capitulo de projeção, e se usassemos os triangulos $$EFH$$ e $$ABD$$, teriamos como exemplo os seguintes pontos apos as equações de projeção. (Assumindo apenas a transformação neste cubo do exemplo, seria uma translação para $$(0,0,4)$$.)

![Cube](/images/rasterizer/preenchimento/facefilling-011.jpg)

![Cube](/images/rasterizer/preenchimento/facefilling-012.jpg)

Como não houve nenhuma rotação dos triangulos, eles estão paralelos entre sí, e portanto o `lerp` de $$z$$, para qualquer $$y$$ será $$4$$.
Mas conseguimos pensar no triangulo $$AED$$.

![Cube](/images/rasterizer/preenchimento/facefilling-013.jpg)

Uma coisa que vocês vão perceber nas contas acima, é que a interpolação linear esta crescendo rápido demais. O que pode até funcionar, mas vamos perceber que a relação entre $$y$$ e $$z$$ não é linear!

Vamos investigar o porque! Vamos tentar calcular qual o valor de $$z$$ em relação ao ponto $$(x', y')$$ no plano de projeção. Sabemos que a equação do plano é dada por $$Ax + By + Cz + D =0$$. E sabemos que para qualquer ponto no nosso mundo, projetamos este ponto $$(x, y, z)$$ no nosso plano de projeção com as equações : $$x' = \frac{x * d}{z}$$ e $$y' = \frac{y * d }{z}$$. Então vamos ver qual a relação do ponto projetado, com a coordenada $$z$$.

![Cube](/images/rasterizer/preenchimento/facefilling-014.jpg)

![Cube](/images/rasterizer/preenchimento/facefilling-015.jpg)

Então podemos ver que, a relação entre os pontos projetados e $$z$$ original é $$ z = \frac{-dD}{Ax'+ By' + dC}$$. E o que faz sentido: quando projetamos, o ponto no plano de projeção é inversamente proporcional ao eixo $$z$$. Porem esta não é uma equação linear.
Se nós desenharmos o gráfico de $$z$$ teremos a seguinte figura tridimensional:


![Plot](/images/rasterizer/preenchimento/plotting.png)


O que claramente não é linear! Como não é linear, se tentarmos interpolar linearmente $$z$$ não vamos chegar proximo dos valores reais. Mas, conseguimos perceber que o comportamento da inversa, $$\frac{1}{z}$$ é linear:

$$\frac{1}{z} = \frac{Ax' + By' + dC}{-dD}$$

![Plot](/images/rasterizer/preenchimento/plotting2.png)

Então ao inves de usarmos $$z$$ para interpolar, vamos usar $$\frac{1}{z}$$ e vamos conseguir interpolar linearmente. Então a alteração em nosso algoritmo de $$z$$-buffer vai funcionar ao contrario: Vamos iniciar todas as posições do nosso buffer com $$0$$ e vamos comparar o valor com o inverso, ao inves de compararmos se o valor interpolado é menor, checaremos se o valor é maior do que o salvo no buffer.

Vamos ver a implementação

{% include pseudocode.html id="5" code="
\begin{algorithm}
\caption{PrencherTriangulo, onde teremos um buffer global chamado zBuffer}
\begin{algorithmic}
\PROCEDURE{PreencherTriangulo}{$V1, V2, V3$}
  \STATE $X_{valores}\overline{V1V2} = $ \CALL{LERP}{$V1.y, V2.y, V1.x, V2.x$}
  \STATE $X_{valores}\overline{V2V3} = $ \CALL{LERP}{$V2.y, V3.y, V2.x, V3.x$}
  \STATE $X_{valores}\overline{V1V3} = $ \CALL{LERP}{$V1.y, V3.y, V1.x, V3.x$}

  \STATE $z_{valores}\overline{V1V2} = $ \CALL{LERP}{$V1.y, V2.y, V1.z, V2.z$}
  \STATE $z_{valores}\overline{V2V3} = $ \CALL{LERP}{$V2.y, V3.y, V2.z, V3.z$}
  \STATE $z_{valores}\overline{V1V3} = $ \CALL{LERP}{$V1.y, V3.y, V1.z, V3.z$}

  \STATE $X_{valores}\overline{V1V2V3}$ = $ X_{valores}V1V2 \cup X_{valores}V2V3 $
  \STATE pontoMédio = \CALL{size}{$X_{valores}V1V2V3$} $ \div 2$

  \IF{$X_{valores}V1V2V3[pontoMédio] > X_{valores}V1V3$}
    \STATE $x_{valor}AEsquerda$ = $X_{valores}V1V2V3$
    \STATE $x_{valor}ADireita$= $X_{valores}V1V3$
    \STATE a mesma coisa para os z_{valores}
  \ELSE
    \STATE $x_{valor}ADireita$ = $X_{valores}V1V2V3$
    \STATE $x_{valor}AEsquerda$= $X_{valores}V1V3$
    \STATE a mesma coisa para os z_{valores}
  \ENDIF

  \FOR{$V_1$ \TO $V3$ em $y$}
    \STATE z-Scan = \CALL{LERP}{x_{mais a esquerda}, x_{mais a direita}, z_{valores mais à esquerda}, z_{valores mais à direia}}
    \FOR{maisAEsquerda \TO maisADireita}
      \IF{zBuffer[x][y]$ < $z-Scan[x][y]}
        \STATE \CALL{ponhaPixel}{x, y}
        \STATE zBuffer[x][y] = z-Scan[x][y]
      \ENDIF
    \ENDFOR
  \ENDFOR

\ENDPROCEDURE
\end{algorithmic}
\end{algorithm}
" %}

Ou seja, nesta ultima versão atualizada do algoritmo vamos interpolar linearmente $$\frac{1}{z}$$ em relação a variavel independente $$y$$. Com isso saberemos qual o $$z$$-coordenada de cada $$y$$ coordenada pertecente ao triangulo que está sendo preenchido. Quando formos iterear sob cada linha do triangulo, vamos novamente computar qual o $$z$$-coordenada de cada pixel chamando `LERP(x_mais_a_esquerda, x_mais_a_direita, z_mais_a_esquerda, z_mais_a_direita)`. Dessa forma vamos saber quais os valores de $$z$$ para cada pixel. Então vamos conseguir atualizar nosso `z- Buffer` para cada pixel. E se o pixel computado for maior que o pixel atual, então colorimos.

Segue uma implementacão que ja conseguimos desenhar as faces:

![Exemplo](/images/rasterizer/preenchimento/facefilling-016.png)

## E as faces ocultas?

O algoritmo de z-buffering nos garante que as faces mais proximas da camera serão desenhadas por ultimo. O que ja garante que os triangulos serão propriamente desenhados.
Porem, ainda há um excesso de trabalho pois os triangulos que estao nas faces "ocultas", isto é, as faces que estão atras dos triangulos desenhados tambem são desenhados, porem, no fim, são redesenhados por cima pelos triangulos mais proximos. Porem conseguimos pensar em um algoritmo que evita esse retrabalho e evitar esse disperdício de computação com um pouco de algebra linear.

Para removermos as faces ocultas vamos usar algumas propriedades de algebra linear. Primeiro vamos descrever a ideia: O que queremos é saber quais são as faces que estao voltadas na direção da camera. As demais faces não vao estar voltadas para a camera vamos ignorar. Então vamos imaginar que conseguimos ter uma seta em cada face do poligono apontando na direção em que ela esta voltada.

![Face Culling](/images/rasterizer/preenchimento/facefilling-017.jpg)

Então imagine que temos uma "seta" que indica qual a direção que a camera está observando a nossa cena. Se a seta tem um angulo menor que $$90$$ graus em relação a nossa camera, significa que essa face está na direção da camera. Caso contrário, ela está para tras e portanto a nossa camera não esta vendo esta face.

![Face Culling](/images/rasterizer/preenchimento/facefilling-018.jpg)

Felizmente conseguimos obter essas "setas" e calcular os angulos entre as retas e vetores com certa facilidade. Podemos obter vetores como vimos nos textos poassados subtraindo um ponto de outro ponto. Podemos então para cada triangulo do nosso cubo obter quais são os vetores da face do triangulo. Imaginando nosso triangulo $$ABC$$, podemos obter os vetores $$AB = B - A$$, $$BC = C - A$$ e $$CA = A - C$$.

Em algebra linear existe uma operação que dado dois vetores nos dá qual o plano que contem ambos os vetores. O resultado dessa operação é um vetor que é ortogonal aos dois vetores ao mesmo tempo. Esta operação é chamada de `cross product` , ou produto vetorial. Então temos o vetor perpendicular a face do triangulo. Agora precisamos saber como medir o angulo entre esse vetor e o vetor da camera.

Conseguimos medir o angulo de dois vetores com o `dot product`, ou produto escalar de dois vetores. A ideia do produto escalar é bem simples: dado dois vetores, quando projetaoms um ao outro, o vetor projetado é um multiplo de $$cos \theta$$. Então conseguimos saber qual o angulo entre dois vetores usando o produto escalar dos dois vetores. Caso o produto escalar dividido pela magnitude dos dois vetores seja maior do que o angulo que estamos esperando ($$90$$), então sabemos que esta face esta voltadda para longe da camera.

Vamos ver melhor como isso funciona:

![Face Culling](/images/rasterizer/preenchimento/facefilling-019.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-020.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-021.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-023.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-024.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-025.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-026.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-028.jpg)
![Face Culling](/images/rasterizer/preenchimento/facefilling-027.jpg)


{% include codepen.html hash="zYWGpQg" username="lrdass" title="Descrevendo uma cena 3D" %}
