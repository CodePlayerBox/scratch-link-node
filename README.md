# scratch-link-node

scratch-link-node 是ScratchLink的Node.js实现版本，目前仅在树莓派上做过验证。

## 目标

通过在树莓派上运行scratch-link-node，理论上浏览器中的Scratch 3.0 蓝牙扩展插件（如micro:bit）可以通过WebSocket连接到树莓派，然后再通过树莓派上的蓝牙设备去连接相应的扩展硬件， 该做法一些可以预见的好处有：

1. 对于运行Scratch 3.0软件的机器来讲，可以不再受蓝牙硬件及ScratchLink软件的限制。比如我在自己的Macbook上即使安装了ScratchLink也无法连接到micro:bit；又比如你想在平板上运行Scratch 3.0，但官方的ScratchLink似乎还不支持这些平台。

2. 可以利用同样的体系结构和方法将其他开源硬件（如Arduino）接入到Scratch 3.0。

3. 纯粹为目前仍闭源的ScratchLink提供另外一种可能性。

4. 让我再想想...

## 硬件支持

* micro:bit 测试通过
* LEGO EV3 手头没有硬件

## 构建运行

1. 在开发主机上，通过Ansible将代码同步到树莓派上
```
cd playbooks
ansible-playbook -i inventories/hosts deploy-to-rpi.yml
```

2. 在树莓派上，执行下面的命令进行构建
```
cd ~/CodePlayerBox/scratch-link-node
docker-compose build
```

3. 进入script目录下，然后执行下面的命令启动
```
cd script
./scratch_link start
```

