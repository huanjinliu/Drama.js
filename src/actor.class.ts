/**
 * 角色类
 */
class Actor<T extends unknown> {
  /** 角色上下文 */
  public ctx: any;

  /** 角色名 */
  public name: string;

  /** 角色所代表值 */
  public value: T;

  /** 计划 */
  private _plans: any[];

  /** 额外传入自定义属性 */
  // eslint-disable-next-line no-undef
  [key: string]: any;

  constructor(name: string, { ctx, value }) {
    this._plans = [];

    this.ctx = ctx;
    this.name = name;
    this.value = value;

    this.enter = undefined;
    this.leave = undefined;
    this.get = undefined;
    this.set = undefined;
  }

  /**
   * 根据角色名选择对应渲染器加载角色
   */
  async load() {
    const render = this.ctx._actorRenders[this.name];

    if (render) {
      this.ready(await render(this));
    }
  }

  /**
   * 角色加载完成，挂载渲染器数据
   * @param options 渲染器数据
   */
  ready(options?: Record<string, any>) {
    if (!options) return;

    const { enter, leave, get, set, ...rest } = options;
    this.enter = enter;
    this.leave = leave;
    this.get = get;
    this.set = (updateOptions: Record<string, any>) => {
      Object.entries(updateOptions).forEach(([key, value]) => set(key, value));
      return this;
    };
    // 设置其余自定义事件
    Object.entries(rest).forEach(([key, value]) => {
      if (!(key in this)) this[key] = value;
    });
  }

  /**
   * 执行当前帧，如果不是最后一帧会返回下一帧的执行函数
   * @param options 最后转换达到的配置
   * @param duration 执行时间
   * @param delay 延迟执行时间
   * @param goneTime 已执行时间
   * @returns 下一个
   */
  executeFrame(options: Record<string, any> = {}, duration = 0, delay = 0, goneTime = 0) {
    if (!this.get || !this.set) return undefined;

    if (delay > 0) return () => this.executeFrame(options, duration, delay - 16);

    const nextOptions = Object.entries(options).reduce((result, [key, value]) => {
      const _result = result;

      // 只有数值型的变换才有过渡时间，其他类型忽略过渡时间
      if (typeof this.get(key) === 'number') {
        // 计算需要的过渡次数，duration是毫米数
        // 一般window.requestAnimationFrame刷新一次需要16毫米, 所以需要除去16
        // 同时要考虑设置倍数，且至少过渡一次
        let refreshTimes = Math.floor(duration / 16 / this.ctx.speed) - goneTime;
        if (refreshTimes < 1) refreshTimes = 1;

        const dValue = (value - this.get(key)) / refreshTimes;

        const newValue = this.get(key) + dValue;
        if (
          (dValue > 0 && newValue > value) ||
          (dValue < 0 && newValue < value) ||
          newValue === value
        ) {
          this.set({ [key]: value });
          return _result;
        }

        this.set({ [key]: newValue });
        _result[key] = value;
      } else {
        this.set({ [key]: value });
      }
      return _result;
    }, {});

    if (Object.keys(nextOptions).length) {
      return () => this.executeFrame(nextOptions, duration, 0, goneTime + 1);
    }

    return undefined;
  }

  /**
   * 动画计划，用于链式调用
   * @param options 最后转换达到的配置
   * @param duration 执行时间
   * @param delay 延迟执行时间
   * @returns 角色本身
   */
  plan(options: Record<string, any>, duration = 0, delay = 0) {
    this._plans.push({ options, duration, delay });
    return this;
  }

  /**
   * 执行动画，根据场景配置判断是自运行还是协同运行
   * @param options 最后转换达到的配置
   * @param duration 执行时间
   * @param delay 延迟执行时间
   * @returns 若外部设置协同则首帧执行动画否则返回自执行promise
   */
  animation(options?: Record<string, any>, duration = 0, delay = 0) {
    // 获取计划中的动画帧
    const getPlanFrame = () => {
      const planFrame = this._plans.shift();
      return (
        planFrame &&
        (() => this.executeFrame(planFrame.options, planFrame.duration, planFrame.delay))
      );
    };
    // 执行首帧动画
    const executeFirstFrame = () => {
      // 如果有传参则判断是否有计划
      if (options) return this.executeFrame(options, duration, delay);
      // 如果无传参尝试获取计划中的动画帧
      return getPlanFrame();
    };
    // 如果是协同动画抛出动画执行给上下文来引导协同执行
    if (this.ctx._together) return executeFirstFrame;
    // 否则自执行动画
    const promise = new Promise<Actor<T>>((reslove) => {
      const execute = (frame: typeof executeFirstFrame) => {
        window.requestAnimationFrame(() => {
          const next = frame();

          this.ctx.render();

          // 如果还有下一帧动画继续执行
          if (next) execute(next);
          else {
            // 判断是否有链式调用
            const planFrame = getPlanFrame();
            if (planFrame) execute(planFrame);
            else reslove(this);
          }
        });
      };
      execute(executeFirstFrame);
    });

    return promise;
  }
}

export default Actor;
