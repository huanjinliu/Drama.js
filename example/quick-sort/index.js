const { fabric, drama: Drama } = window;

// 快速排序演示
(async () => {
  const _canvas = document.querySelector('#canvas');
  const _fabricCanvas = new fabric.StaticCanvas(_canvas, {
    width: 800,
    height: 800,
  });
  const $ = new Drama({
    render: () => {
      _fabricCanvas.renderAll();
    },
  });

  $.designActor('card', async (actor) => {
    const text = new fabric.Text(actor.value.toString(), {
      fontSize: 25,
      fill: '#333',
      originX: 'center',
      originY: 'center',
    });
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 35,
      height: 50,
      rx: 3,
      ry: 3,
      fill: 'transparent',
      stroke: '#333',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
    });
    const group = new fabric.Group([rect, text], {
      left: 0,
      top: 0,
      opacity: 0.8,
    });

    return {
      enter: () => {
        _fabricCanvas.add(group);
      },
      leave: () => {
        _fabricCanvas.remove(group);
      },
      get: (key) => {
        return group[key];
      },
      set: (key, value) => {
        switch (key) {
          case 'fill':
            return group.item(0).set({ fill: value });
          default:
            return group.set({ [key]: value });
        }
      },
    };
  });

  $.designActor('arrow', async () => {
    const arrowSvg = await new Promise((resolve) => {
      fabric.loadSVGFromURL('./icon-arrow-up.svg', async (objects) => {
        const svg = await fabric.util.groupSVGElements(objects);
        resolve(svg);
      });
    });

    arrowSvg.set({ left: 0, top: 0, originX: 'center' });

    return {
      hadEnter: () => {
        return _fabricCanvas.getObjects().indexOf(arrowSvg) !== -1;
      },
      enter: () => {
        _fabricCanvas.add(arrowSvg);
      },
      leave: () => {
        _fabricCanvas.remove(arrowSvg);
      },
      get: (key) => {
        return arrowSvg[key];
      },
      set: (key, value) => {
        switch (key) {
          case 'stroke':
            arrowSvg.getObjects().forEach((item) => item.set({ [key]: value }));
            break;
          default:
            arrowSvg.set({ [key]: value });
        }
      },
    };
  });

  $.designAction('init-arrow', async (ctx, arrows) => {
    for (let i = 0; i < arrows.length; i++) {
      const [arrow, index] = arrows[i];

      if (arrow.hadEnter()) {
        await arrow.animation({ left: 37 / 2 + (37 + 10) * index }, 500);
      } else {
        arrow.set({ left: 37 / 2 + (37 + 10) * index }).enter();
      }
    }
  });

  $.designAction('compare', async (ctx, arrows) => {
    for (let i = 0; i < arrows.length; i++) {
      const [arrow, index] = arrows[i];
      await arrow.animation({ left: 37 / 2 + (37 + 10) * index }, 500, 20);
    }
  });

  $.designAction('wrap', async (ctx, cards, arrows) => {
    await ctx.together(() => cards.map((card) => card.animation({ opacity: 0.2 }, 50)));
    for (let i = 0; i < arrows.length; i++) {
      const [arrow, card, index] = arrows[i];
      await ctx.together(() => [
        card.animation({ left: (37 + 10) * index, opacity: 1 }, 500, 20),
        arrow.animation({ left: 37 / 2 + (37 + 10) * index }, 500, 20),
      ]);
    }
    await ctx.together(() => cards.map((card) => card.animation({ opacity: 1 }, 50)));
  });

  $.designAction('sure', async (ctx, card) => {
    await card.animation({ fill: 'pink' }, 200);
  });

  // const arr = [6, 1, -5, 20, 8, -4, 11, 3, 28, 9];
  const arr = [];

  const initCanvas = async () => {
    $.prepare();
    _fabricCanvas.clear();

    const arrActors = await $.createActors('card', arr, (actor, index) => {
      actor.set({
        left: index * actor.get('width') + index * 10,
      });

      actor.enter();
    });

    const { initArrow, compare, wrap, sure } = $.createActions([
      { name: 'init-arrow', description: '初始化指向箭头' },
      { name: 'compare', description: '数值比对' },
      { name: 'wrap', description: '数值交换' },
      { name: 'sure', description: '确定基准值位置' },
    ]);

    const leftArrow = await $.createActor('arrow', 0, (arrow) =>
      arrow.set({ top: 60, stroke: '#333' })
    );
    const rightArrow = await $.createActor('arrow', 0, (arrow) =>
      arrow.set({ top: 60, stroke: '#333' })
    );
    const flagArrow = await $.createActor('arrow', 0, (arrow) =>
      arrow.set({ top: 90, stroke: 'red' })
    );

    const quickSort = (array, i, j) => {
      if (i >= j) return;

      const arr = array;
      const flag = i;
      let left = i;
      let right = j;

      initArrow([
        [flagArrow, i],
        [leftArrow, i],
        [rightArrow, j],
      ]);

      while (left < right) {
        while (
          compare([
            [rightArrow, right],
            [flagArrow, flag],
          ]).code(() => {
            return right > left && arr[right].value >= arr[flag].value;
          })
        )
          right--;
        while (
          compare([
            [leftArrow, left],
            [flagArrow, flag],
          ]).code(() => {
            return left < right && arr[left].value <= arr[flag].value;
          })
        )
          left++;

        wrap(arr, [
          [rightArrow, arr[left], right],
          [leftArrow, arr[right], left],
        ]).code(() => {
          const temp = arr[left];
          arr[left] = arr[right];
          arr[right] = temp;
        });
      }

      wrap(arr, [
        [flagArrow, arr[left], flag],
        [leftArrow, arr[flag], left],
      ]).code(() => {
        const temp = arr[left];
        arr[left] = arr[flag];
        arr[flag] = temp;
      });

      sure(arr[left]);

      quickSort(arr, i, left);
      quickSort(arr, left + 1, j);
    };

    quickSort(arrActors, 0, arrActors.length - 1);
  };

  window.$drama = $;
  window.addNumber = (number) => {
    arr.push(number);
    initCanvas();
  };
  window.randomNumber = () => {
    arr.forEach((item, index) => {
      const random = Math.floor(Math.random() * arr.length);

      arr[index] = arr[random];
      arr[random] = item;
    });

    initCanvas();
  };
})();
