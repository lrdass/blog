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

![Cena](/images/rasterizer/descricao-cena/d-cena-01.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-02.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-03.jpg)
![Cena](/images/rasterizer/descricao-cena/d-cena-04.jpg)
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
