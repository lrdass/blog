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

E ai vai bastar que a gente consiga controlar qual face vai ser desenhada. Existindo a técnica do pintor: O pintor quando vai produzir seus quadros primeiro desenha o fundo, depois o que ta um pouco a frente do fundo e por fim o que está mais próximo. Podemos usar este algoritmo. O problema é que existem figuras que o algoritmo do pintor ainda não vai conseguir resolver. Então uma melhoria no algoritmo do pintor seria que ao invés de pintar triangulo por triangulo dada a profundidade, pintarmos um pixel por profundidade. Então sempre coloríamos o pixel com a $$z$$coordenada mais próxima da câmera.

Por fim, há portanto de se pensar que existem inúmeras faces do nosso modelo que nunca seriam vistas, e de toda forma, estariam sendo pintadas com o algorismo do pintor. Então para melhorar a eficiência, poderíamos saber quais sao as faces que vao ser pintadas e remover as que nao serão. Sendo este algoritmo chamado de `face culling`. Ao combinarmos estes algoritmos vamos conseguir visualizar nossos modelos tridimensionais propriamente coloridos!

{% include codepen.html hash="zYWGpQg" username="lrdass" title="Descrevendo uma cena 3D" %}
