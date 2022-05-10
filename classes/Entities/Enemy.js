import seedGen from "../SeedGen.js";
import assetsMng from "../AssetsMng.js";
import { setDebugMode, getDebugMode } from "../DebugMode.js";
import Character from "./Character.js";
import Sprite from "../Sprite.js";
import { slime_atributos, slime_crescimento_por_nivel } from './EnemiesBaseAttributes.js';


export default class Enemy extends Character {

    constructor(nivel) {
        super({ s: 22, w: 22, h: 10, nomeImagem: "slime", sizeImagem: 22 });
        this.alvo = null;
        this.nivel = nivel;
        this.roomNumber = -1;
        this.indexNaSala = -1;
        this.animation = [];
        this.room = null;
        this.hitpoint = 40;
        this.qtdAnimacoes = { types: 2, lines: [1, 0], qtd: [3, 9] /* atacking: 9, normal: 3*/ };
        this.speedAnimation = 11.49; //1.2;
        this.type = 0;
        this.pose = 0;
        this.raioAtaque = 5;
        this.matrizImagem = {
            linha: 1,
            colunas: 9,
            widthImagem: 22,
            heightImagem: 22
        };
        this.cooldownAtaque = 1;                  //Tempo travado até terminar o ataque            
        this.cooldownImune = 0;
        this.imune = false;
        this.atributos = Object.assign({}, slime_atributos);
        this.balancearDificuldade();
        //this.status = 0;                        // 0 => Normal, 1 => Ataque
        this.criarAnimacoes();
    }


    movimento(dt) {
        this.pose = this.pose + this.speedAnimation * dt;
        this.controleInvencibilidade();
        this.mover(dt);
        if (this.type === 1) {
            this.cooldownAtaque = this.cooldownAtaque - 2 * dt;
        }
    }

    controleInvencibilidade(dt) {
        this.cooldownImune = this.cooldownImune - dt;
        if (this.cooldownImune < 0) {
            this.imune = false;
        }
        else {
            //this.cooldownAtaque = 0;
            //this.type = 0;
        }
    }

    ativarInvencibilidade() {
        this.cooldownImune = 1.2;
        this.imune = true;
    }

    criarAnimacoes() {
        // Cria a lista de tipos de animações
        for (let i = 0; i < this.qtdAnimacoes.types; i++) {
            let auxAnimation = {
                animationFrame: [],
                type: i,
                qtdFrames: this.qtdAnimacoes.qtd[i]
            }
            this.animation.push(auxAnimation);
        }

        for (let i = 0; i < this.animation.length; i++) {             // Animações
            for (let j = 0; j < this.animation[i].qtdFrames; j++) {   // Frames
                let animationFrame = {
                    sizeImagem: this.s,
                    pose: j,
                    sx: 1 + 23 * j,
                    sy: 1 + 23 * this.qtdAnimacoes.lines[i],
                };
                this.animation[i].animationFrame.push(animationFrame);
            }
        }

        this.pose = seedGen.nextRandInt(0, 50);             // Sorteia uma posição inicial para que os 
        // inimigos não fiquem sincronizados
    }

    desenhar(ctx) {
        super.desenhar(ctx);
    }

    desenharHP(ctx) {
        super.desenharHP(ctx);
    }

    persegue(alvo) {
        if (this.alvo === null) {
            const dx = Math.floor(alvo.x) - Math.floor(this.x);
            const dy = Math.floor(alvo.y) - Math.floor(this.y);
            const d = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(d) < this.raioAtaque * (this.map.s / 2)) {       //(k * 16) ==> 16 tamanho do celula
                this.alvo = alvo;
                this.persegue();
                return;
            }

        } else {
            const dx = Math.floor(this.alvo.x) - Math.floor(this.x);
            const dy = Math.floor(this.alvo.y) - Math.floor(this.y);
            this.vx = 20 * Math.sign(dx);
            this.vy = 20 * Math.sign(dy);
        }
    }

    attackPlayer(player) {
        if (this.colidiuCom3(player) && this.type === 0) {    // Detecta o player e não ta atacando
            this.type = 1;
            this.cooldownAtaque = 1;
        }
        if (this.cooldownAtaque < 0 && this.type === 1) {
            this.type = 0;
            if (this.colidiuCom3(player)) {
                if (player.hp > 0) {
                    player.hp = player.hp - this.atributos.ataque;
                    player.ativarInvencibilidade();
                }
                else {
                    player.hp = 0;
                }
            }
        }
    }

    morrer() {
        super.morrer();
        console.log('Morrer enemy');
        console.log(this.atributos);
        console.log(this.roomNumber);
        delete this.room.enemies[this.indexNaSala];
    }

    balancearDificuldade() {
        for (const keyAtributo in this.atributos) {
            const valorBase = this.atributos[keyAtributo];
            let novoValor = valorBase * Math.pow(slime_crescimento_por_nivel[keyAtributo], (this.nivel - 1));
            this.atributos[keyAtributo] = novoValor;
        }
        this.hpAtual = this.atributos.hpMax;
    }
}