import Actor from './actor.class';

/**
 * 剧场状态
 * @stop 暂停
 * @play 演出中
 */
enum DRAME_STATUS {
  stop = 0,
  play = 1,
}

/**
 * 行为配置
 * @name 名称
 * @description 行为描述
 */
interface ActionOptions {
  name: string;
  description?: string | ((...args: any[]) => string);
}

/** 行为 */
type Action = string | ActionOptions;

/**
 * 帧
 * @result 运行代码结果
 * @play 帧播放
 */
interface Frame<T> extends ActionOptions {
  result?: T;
  play: (frameOptions: any) => Promise<void>;
}

/**
 * 剧场类
 */
class Drama {
  /** 剧场记录帧列表 */
  private _frames: Frame<unknown>[];

  /** 已播出帧列表 */
  private _goneFrames: ActionOptions[];

  /** 角色渲染器列表 */
  private _actorRenders: Record<string, () => any>;

  /** 行为渲染器列表 */
  private _actionRenders: Record<string, (...args: any[]) => any>;

  /** 是否协同 */
  private _together: boolean;

  /** 播放速度 */
  private _speed: number;

  /** 剧场状态 */
  private _status: DRAME_STATUS;

  /** 渲染函数 */
  public render: () => void;

  constructor(options: { render?: () => void } = {}) {
    const { render = () => {} } = options;

    this._frames = [];
    this._goneFrames = [];
    this._actorRenders = {};
    this._actionRenders = {};
    this._together = false;
    this._speed = 1;
    this._status = DRAME_STATUS.stop;

    this.render = render;
  }

  get speed() {
    return this._speed;
  }

  set speed(rate) {
    if (rate < 0.2) this._speed = 0.2;
    else if (rate > 10) this._speed = 10;
    else this._speed = rate;
  }

  /**
   * 设计行为
   * @param name 行为名称
   * @param render 行为渲染器
   */
  designAction(name: string, render: () => void) {
    if (!/^[a-z][a-z-]+$/.test(name)) {
      throw TypeError(`${name} is not a valid name! The name should be in the form of "xxx-xxx"!`);
    }
    this._actionRenders[name] = render;
  }

  /**
   * 设计角色
   * @param name 角色名称
   * @param render 角色渲染器
   */
  designActor(name: string, render: () => void) {
    this._actorRenders[name] = render;
  }

  /**
   * 实体化批量角色
   * @param name 角色名称
   * @param valueList 角色代表值
   * @param onInit 初始监听方法
   * @returns 角色列表
   */
  async createActors<T>(
    name: string,
    valueList: T[],
    onInit: (value: Actor<T>, index: number, arr: T[]) => void
  ) {
    if (!Array.isArray(valueList)) {
      throw TypeError(`${valueList} is not a array!`);
    }
    const promises = valueList.map((value, index) =>
      this.createActor(name, value, (item: Actor<T>) => onInit(item, index, valueList))
    );

    const actors = await Promise.all(promises);
    return actors;
  }

  /**
   * 实体化单个角色
   * @param name 角色名称
   * @param value 角色代表值
   * @param onInit 初始监听方法
   * @returns 角色
   */
  async createActor<T>(name: string, value: T, onInit?: (actor: Actor<T>) => void) {
    const actor = new Actor<T>(name, {
      ctx: this,
      value,
    });

    await actor.load();

    onInit?.(actor);

    return actor;
  }

  /**
   * 实体化批量行为
   * @param list
   * @returns
   */
  createActions(options: Action[]) {
    const actions: Record<
      string,
      (...args: any[]) => {
        code: (callback: () => unknown) => unknown;
      }
    > = {};

    // 将名称格式化为驼峰命名
    const formatName = (name: string) =>
      name
        .split('-')
        .map((part, index) =>
          part.replace(/^(.)/, (word) => {
            return index === 0 ? word : word.toUpperCase();
          })
        )
        .join('');

    // 注册
    options.forEach((item) => {
      if (typeof item === 'string' && this._actionRenders[item]) {
        actions[formatName(item)] = this.createAction(item);
      }
      if (typeof item === 'object' && this._actionRenders[item.name]) {
        const { name, ...rest } = item;
        actions[formatName(name)] = this.createAction(name, rest);
      }
    });

    return actions;
  }

  /**
   * 实体化单一行为
   * @param name 行为名称
   * @returns
   */
  createAction<T>(name: string, options: Omit<ActionOptions, 'name'> = {}) {
    const { description } = options;
    return (...args: any[]) => {
      const actionRender = this._actionRenders[name];

      if (actionRender) {
        const frame: Frame<T> = {
          name,
          description: typeof description === 'function' ? description(...args) : description,
          play: async (frameOptions) => {
            await actionRender(
              {
                ...frameOptions,
                together: this.together.bind(this),
              },
              ...args
            );
            // 最后还得加一次页面刷新，部分render内只设置而不做更新
            this.render();
          },
        };
        this._frames.push(frame);

        return {
          code: (callback: () => T) => {
            if (!callback) throw ReferenceError('code callback must be a function!');

            const result = callback();
            frame.result = result;

            return result;
          },
        };
      }

      return { code: (callback: () => T) => callback() };
    };
  }

  /**
   * 剧场准备，初始必要属性
   */
  prepare() {
    this._frames = [];
    this._together = false;
    this._status = DRAME_STATUS.stop;
  }

  /**
   * 设置角色协同动画
   * @param getExecutors 获取角色动画列表
   * @returns
   */
  together(
    getExecutors: () => ((
      options?: Record<string, any>,
      duration?: number,
      delay?: number
    ) => () => any)[]
  ) {
    // 设置场景为共同执行
    this._together = true;

    // 获取执行列表
    const executors = getExecutors();

    // 执行同步动画
    return new Promise((reslove) => {
      const execute = (_executors: typeof executors) => {
        window.requestAnimationFrame(() => {
          const nexts = _executors.map((item) => item()).filter(Boolean);

          // 刷新场景
          this.render();

          // 如果还有下一帧动画继续执行
          if (nexts.length) execute(nexts);
          else {
            // 将场景重置回单元素执行
            this._together = false;
            reslove(undefined);
          }
        });
      };
      execute(executors);
    });
  }

  /**
   * 暂停播放
   */
  stop() {
    this._status = DRAME_STATUS.stop;
  }

  /**
   * 开始播放
   * @param frameNumber 播放帧数
   * @returns
   */
  play(frameNumber = Infinity) {
    // 播放中或是无播放帧时跳出
    if (this._status === DRAME_STATUS.play || !this._frames.length) return;

    this._status = DRAME_STATUS.play;

    const frame = this._frames.shift();
    if (!frame) return;

    const { name, description, play, ...restOptions } = frame;
    let finish = 0;

    window.requestAnimationFrame(async () => {
      if (play) await play({ name, description, ...restOptions });

      finish += 1;
      this._goneFrames.push({ name, description });

      if (this._status === DRAME_STATUS.stop) return;

      this._status = DRAME_STATUS.stop;

      if (finish < frameNumber) this.play();
    });
  }
}

export default Drama;
