---
layout: post
title:  " 'Times on times he divided and measur'd' - William Blake, e como projetar os objetos da terceira dimensão"
date:   2022-06-07 15:35:05 -0300
categories: rasterizer william-blake
---


![Urizen realizando com seu compasso a primeira mensura do mundo manifesto](/images/rasterizer/perspectiva/urizen.jpg)
>"Por vezes e vezes ele dividiu, e mediu<br>
> espaço por espaço em sua nove vezes escuridão,<br>
> o não visto, o não conhecido, as mudanças apareceram<br>
> como montanhas desoladas, racharam furiosas<br>
> pelos ventos escuros da pertubação"<br>
> tradução livre do primeiro capitulo do livro de Urizen de William Blake

Em algum momento imaginei que eventualmente citaria William Blake. E em particular um de seus personagens de sua cosmogonia pessoal: Urizen.
William Blake foi, se me permitem resumir seus feitos, um pintor e poeta inglês que viveu uma época de instabilidade religiosa na Inglaterra. Como os ingleses não seguiam os preceitos católicos vindos do Vaticano desde a rebelião de Henrique VIII o povo inglês era uma amalgama de vários grupos cristãos e cada grupo com a sua própria visão e valores do que era ser cristão.

Blake não era diferente dos demais ingleses. Tido por muitos como peculiar (talvez um eufemismo para o que alguns chamariam de loucura) ele afirmava que tinha visões e vislumbres de realidades mais sensíveis do que nós, indivíduos com menor capacidade visual/espiritual, apenas podemos conjecturar. Para nossa sorte Blake pintou e escreveu todas suas ideias e visões. E nesse processo criou sua própria cosmogonia e seu próprio panteão de personagens que prototipavam os arquétipos do ser humano, e por extensão, da realidade em sí.

Então voltamos ao homem da pintura acima. Ele é Urizen. Na cosmogonia de Blake é o lado racional do homem. Urizen, ou a razão, quando nasce e ve a sí própria, acredita que ela foi o motivo em sí mesma, e logo, não existe nada além dela. Então Urizen conclui que tudo ao seu redor deve nascer de sí.

Então caros amigos, criarmos um mundo tridimensional em um equipamento que usa apenas a lógica é onde exercemos a maior óde a Urizen possível. Aqui é onde estamos começando uma aventura em ideias de como simular a física de nosso mundo e até de compreender como a logica do próprio universo funciona para capturar essas ideias e representar em uma linguagem lógica que nossas maquinas de Turing consigam resolver e acender as cores certas na tela.

## Do que você está falando ?
Neste texto nós vamos começar a representar figuras tridimensionais. Para isso vamos ter uma interpretação do espaço do mundo simulado e do espaço bidimensional da tela. E encontrar uma forma de identificar o que está na tela da câmera e, por fim, projetar o mundo tridimensional na tela.
Estas ideias são a base da computação gráfica. E os algoritmos podem suscitar ideias sobre a simulação da realidade, o quão longe podemos ir e quais as restrições. Então vamos colorir nossas ideias e saber o que em nós esta assumindo o controle quando estamos no papel de criar um universo em nossas próprias mãos. Um spoiler: na cosmogonia de Blake, Urizen não necessariamente é o bonzinho da história.

Então como vai funcionar ? Bom nós queremos ter objetos com três dimensões em um espaço tridimensional e queremos ter alguma forma de filma-los, ou seja, alguma forma de saber quais objetos e/ou quais partes desses objetos estão na nossa tela.
Então... vamos pensar em uma câmera. Imagine que teremos uma câmera onde o que ela captura na verdade vai ser nossa tela.

![Experimento da câmera escura](/images/rasterizer/perspectiva/pinhole.jpg)

Uma câmera funciona como o [experimento da câmara escura][1]. Em que a fotografia ou o video é capturado dentro da câmera.
Podemos reproduzir o experimento da câmera escura simplificado, onde o plano onde a luz vai ser projetada vai ser um plano conhecido, e esse plano vai ser a nossa tela.

A ideia para descobrir isso vai ser com um pouquinho de geometria. Mas o que queremos procurar é qual o ponto $$P'$$ no plano de projeção para um ponto $$P$$ no mundo. E vamos fazer essa pergunta para todos os pontos do mundo. Os pontos que estiverem dentro do intervalo da nossa tela $$[-0.5, 0.5]$$ em $$x$$ e $$[-0.5, 0.5]$$ em $$y$$. Dai com a nossa tela com vários pontos dos nossos polígonos tridimensionais, vai bastar fazer um mapeamento dos pontos `tela->monitor` que funcionaria como mapear $$[-0.5, 0.5]=> [0, 1980] pixels$$ para a largura e o mesmo para a altura. E com isso teremos o suficiente para projetar pontos tridimensionais para a nossa tela.

```
projetaObjetoTridimensional(objeto):
  para cada objeto no mundo:
    para cada ponto do objeto
      projete o ponto no plano

    desenhe linhas entre os pontos projetados
```

![Image](/images/rasterizer/perspectiva/perspectiva-1-1.jpg)
Vamos usar a cena acima: temos um cubo na cena, e temos um plano centralizado em $$z_+$$, e a uma distancia $$d = 1$$.

Então vamos pensar como podemos obter $$P'$$. Se olhar-mos a nossa cena de forma que o eixo $$y$$ fique pra cima e o eixo $$z$$ para a direita e o $$x$$ na nossa direção, vemos que  foma um triangulo com a reta que liga a origem $$O(0,0,0)$$ cruzando o nosso plano de projeção $$proj$$.
![Image](/images/rasterizer/perspectiva/perspectiva-2-1.jpg)

🤔 se queremos calcular o ponto $$P'$$, podemos ver que o valor da sua $$y$$-coordenada  é o segmento $$\overline{P'A}$$(para ser mais correto: é o valor do segmento $$\overline{P'A}$$ projetado no eixo $$y$$).Sabemos também que o valor da sua $$z$$-coordenada é a mesma da distancia plano $$proj$$ da origem.
Se usarmos a proporção do triangulo de que $$\frac{\overline{P'A}}{\overline{OA}} = \frac{\overline{PB}}{\overline{OB}}$$ então podemos chegar que $$\overline{P'A} = \frac{\overline{OA} * \overline{PB}}{OP}$$.

E sabemos todos os valores que vamos precisar nessa equação: $$\overline{PB}$$  é o valor da $$y$$-coordenada do ponto $$P$$. O valor $$\overline{OA}$$ é a distancia do plano de projeção da nossa origem no eixo $$z$$, portanto, $$d$$. E por fim o valor de $$\overline{OB}$$ é a $$z$$-coordenada do ponto $$P$$. Então temos:

![Image](/images/rasterizer/perspectiva/perspectiva-3-1.jpg)

Para o eixo $$x$$ vamos ter a reciproca! Só que dessa vez vamos olhar como se olhássemos a nossa cena de cima. Com o eixo $$z$$ para cima, o eixo $$x$$ para os lados e o eixo $$y$$ como se tivesse apontado para nós.

![Image](/images/rasterizer/perspectiva/perspectiva-4-1.jpg)


Chegamos em uma equação bem similar, porem considerando a $$x$$ coordenada. Agora sabemos encontrar a posição de um ponto qualquer no mundo projetado no nosso plano de projeção. Vamos testar para ver se acontece como planejado!

![Image](/images/rasterizer/perspectiva/perspectiva-5-1.jpg)

![Image](/images/rasterizer/perspectiva/perspectiva-6-1.jpg)

Vamos supor que nosso plano de projeção esteja a uma distancia de $$d = 1$$  do eixo $$z$$. Isto é, imagine que o centro do plano esteja em $$proj = (0,0,1)$$. E imagine que temos um cubo que tenha os oito pontos à duas unidades na frente do nosso plano e tenha alguns dos pontos: $$P_1(-1, 1, 3), P_2(-1, 1, 4), P_3(-1, -1, 3), P_4(-1, -1, 4), ...$$.

![Image](/images/rasterizer/perspectiva/perspectiva-7-1.jpg)

Se acompanhar as contas acima e desenhar os pontos que encontramos, os pontos que estiverem dentro do intervalo de nosso plano de projeção $$[-0.5, 0.5]$$ vão ser desenhados. E podemos conferir, como desenhamos à esquerda, que nosso algoritmo funciona! Podemos conferir que $$P_1(-1, 1, 3) => (-0.3, 0.3, 1)$$.
Uma percepção da nossa visão é que realmente quanto mais longe as coisas estão de nós, menor elas parecem ficar. Então faz sentido os nossos cálculos dividir por $$z$$ ou seja ... quanto mais longe menor fica 😅.

## hora de implementar !


# Referencias

[1]:https://pt.wikipedia.org/wiki/C%C3%A2mera_escura

