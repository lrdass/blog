---
layout: post
title:  "Preenchendo as faces dos objetos tridimensionais"
date:   2022-07-05 12:28:05 -0300
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

Para preencher triângulos existem vários algoritmos conhecidos. O que vamos usar aqui inicialmente vamos usar a mesma ideia por trás de como desenhamos linhas no nosso primeiro texto. Nós precisamos saber quais são as equações de reta entre os vértices dos triângulos e isso vai permitir nós sabermos quais os pontos estão nas arestas do triangulo. Com essa aresta, se nos iterarmos pela altura do triangulo, para preencher o triangulo vai bastar desenhar uma linha de aresta em aresta para cada valor da altura do triangulo.

```
triangulo:
  | tupla( vertice1, verice2, vertice3)

preencherTriangulo(triangulo)
  para cada y entre o maior y-coordenada dos vertices, e a menor y-coordenada dos vertices:
    calcule a x-coordenada que delimitam o triangulo
    para a menor x-coordenada até a maior:
      coloque um pixel
```

E ai vai bastar que a gente consiga controlar qual face vai ser desenhada. Existindo a técnica do pintor: O pintor quando vai produzir seus quadros primeiro desenha o fundo, depois o que ta um pouco a frente do fundo e por fim o que está mais próximo. Podemos usar este algoritmo. O problema é que existem figuras que o algoritmo do pintor ainda não vai conseguir resolver. Então uma melhoria no algoritmo do pintor seria que ao invés de pintar triangulo por triangulo dada a profundidade, pintarmos um pixel por profundidade. Então sempre coloríamos o pixel com a $$z$$-coordenada mais próxima da câmera.

Por fim, há portanto de se pensar que existem inúmeras faces do nosso modelo que nunca seriam vistas, e de toda forma, estariam sendo pintadas com o algorismo do pintor. Então para melhorar a eficiência, poderíamos saber quais sao as faces que vao ser pintadas e remover as que nao serão. Sendo este algoritmo chamado de `face culling`. Ao combinarmos estes algoritmos vamos conseguir visualizar nossos modelos tridimensionais propriamente coloridos!

Então vamos pensar em como podemos preencher um triangulo. Uma ideia que temos que fixar ja desde o começo é que nossa tela de pixels é discreta. Isto é: todos os indices dos pixels são valores inteiros. Não existe um pixel $$3.4$$ ou $$1.15$$. Então temos que desde ja pensarmos que qualquer valor racional deve ser convertido para um inteiro.

Então vamos ver como podemos chegar no algoritmo para desenhar nosso triangulo. Vimos acima a ideia por tras. Agora vamos ver como podemos implementa-la. Então imagine que temos um triangulo com os vertices $$A (2, 5)$$ $$B (-4, -3)$$ e $$C (5, -3)$$. _OBS: Apenas para relembrar que no primeiro texto e no texto de projeção, nós centralizamos as coordenadas dos pixels da tela para que pudéssemos mapear a nossa tela de projeção _ .
Como vamos iterar sobre o eixo-$$y$$, queremos saber quais são os valores de $$x$$ para cada valor de $$y$$. E para nossa sorte, assim como vimos no primeiro post, podemos usar equações de reta entre dois pontos para determinar a equação linear que conecta os dois pontos. Quando tivermos esta equação, conseguiremos calcular o valor das arestas do triangulo dado uma $$y$$-coordenada. Vamos ver como isso vai funcionar:

// imagem

Queremos então iterar sobre o intervalo do maior valor de $$y$$ dos vertices até o menor valor de $$y$$ dos vertices. No nosso exemplo acima, queremos ir de $$5$$ até $$-3$$.  Então temos as nossas retas entre $$\overline{AB} \rightarrow y = \frac{4x}{3} + \frac{7}{3}$$ e temos que a nossa reta $$\overline{AC} \rightarrow y = - \frac{8x}{3} + \frac{31}{3}$$, e  conseguimos calcular alguns valores de $$x$$ para cada valor de $$y$$. E portanto, como podemos ver quando $$y=2$$ temos que $$x= - \frac{1}{4}$$ para a nossa reta $$\overline{AB}$$ e temos que $$x=\frac{25}{8}$$ para a reta $$\overline{AC}$$. A regra que usamos é arredondar para baixo  para o primeiro inteiro. Entao temos que $$x = -1$$ para $$\overline{AB}$$ e $$x = 3$$ para $$\overline{AC}$$. Agora basta iterar entre $$-1$$ e $$3$$ e preencher cada pixel. E assim temos a base do nosso algoritmo.

#### casos específicos

Para iterar de aresta em aresta, vão existir casos como os triangulos acima em que não necessariamente só precisamos usar duas retas, mas as três retas. O triangulo $$ABC$$, possui o lado $$AB$$ maior que $$AC$$ e $$BC$$. Então quando formos iterar entre as arestas, algum momento iterariamos sobre a aresta $$AC$$ até $$AB$$, e depois de $$CB$$ até $$AB$$.
Com isso em mente vamos conseguir agora preencher qualquer triangulo. Então vamos começar a elaborar nosso algoritmo.

Vamos precisar de alguma ferramenta para conseguirmos calcular as nossas equações de reta. Apesar de nos exemplos anteriores nós chegamos em um sistema de equações lineares bem simples para calcular as retas, resolver sistemas lineares para cada triangulo seria bastante complicado. Então vamos ver se conseguimos pensar em alguma ferramenta que possa nos ajudar.

O que precisamos? Queremos alguma forma de para cada $$y$$, encontrar um $$x$$ das arestas do triangulo. Então vamos assumir que temos uma função $$f(y)$$, que para cada $$y$$, retorna um $$x$$ da aresta do triangulo. Então quando a iteração for acontecer, teremos os valores de $$y$$ dos quais estamos iterando, mas precisamos calcular $$x$$. Então $$x$$ é uma variavel dependente de $$y$$, e $$y$$, neste caso, é uma variável independente.

### Interpolação linear

Conseguimos então chegar que, haverá uma reta, da aresta do triangulo, que vamos querer encontrar um ponto $$P$$ entre os vértices do triangulo para um dado valor de $$y$$. Esta tecnica é conhecida como interpolação linear, e vamos usar bastante essa tecnica daqui em diante.

// imagem

Na imagem acima, podemos visualizar o triangulo formado pelo vertices que queremos calcular a reta. Neste triangulo o lado oposto ao angulo $$\theta$$ é $$y_2 - y_1$$, e o angulo adjacente ao angulo é o lado $$x_2 - x_1$$. A razão do lado oposto pelo adjacente é a tangente do angulo $$\theta$$. Conseguimos perceber que o triangulo formado por $$P_1$$ $$P_2$$ é proporcional ao triangulo formado por $$P_1$$ e o ponto $$P$$ que procuramos. Então conseguimos chegar na seguinte equação:

$$
\frac{y_2 - y_1}{x_2 - x_1} = \tan \theta = \frac{y-y_1}{x-x_1}
$$

Dessa igualdade conseguimos isolar qual vai ser a nossa variavel independe e qual vai ser a nossa variavel dependente. No nosso algoritmo, vamos ter o valor de $$y$$, mas queremos saber qual o valor de $$x$$. Então, como dissemos acima, $$x$$ vai ser nossa variavel dependente. Então vamos resolver essa igualdade para $$x$$.

$$ x = \frac{x_2 - x_1}{y_2 - y_1} \times (y - y_1) + x_1 $$

E podemos enxergar que essa equação realmente é uma equação de reta, da forma $$x = a(y-y_1) + x_1$$, ja que $$x_1$$ é uma constante, e $$a = \frac{y_2 - y_1}{x_2 - x_1} $$ também é .

Vamos testar e ver como essa equação funciona:



{% include codepen.html hash="zYWGpQg" username="lrdass" title="Descrevendo uma cena 3D" %}
