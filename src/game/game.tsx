import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { buttonConfig } from "../config/button-config";

const Game = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [showButton, setShowButton] = useState(true);

  const startGame = () => {
    setShowButton(false);

    class GameScene extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private stars!: Phaser.Physics.Arcade.Group;
      private bombs!: Phaser.Physics.Arcade.Group;
      private platforms!: Phaser.Physics.Arcade.StaticGroup;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private score = 0;
      private gameOver = false;
      private scoreText!: Phaser.GameObjects.Text;

      constructor() {
        super({ key: "GameScene" });
      }

      preload() {
        this.load.image("sky", "/assets/sky.png");
        this.load.image("ground", "/assets/platform.png");
        this.load.image("star", "/assets/star.png");
        this.load.image("bomb", "/assets/bomb.png");
        this.load.spritesheet("dude", "/assets/dude.png", { frameWidth: 32, frameHeight: 48 });
      }

      create() {
        // Add background
        this.add.image(400, 300, "sky");

        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
        this.platforms.create(600, 400, "ground");
        this.platforms.create(50, 250, "ground");
        this.platforms.create(750, 220, "ground");

        // Player setup
        this.player = this.physics.add.sprite(100, 450, "dude");
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Player animations
        this.anims.create({
          key: "left",
          frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1,
        });

        this.anims.create({
          key: "turn",
          frames: [{ key: "dude", frame: 4 }],
          frameRate: 20,
        });

        this.anims.create({
          key: "right",
          frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
          frameRate: 10,
          repeat: -1,
        });

        // Input controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create stars
        this.stars = this.physics.add.group({
          key: "star",
          repeat: 11,
          setXY: { x: 12, y: 0, stepX: 70 },
        });

        this.stars.children.iterate((child) => {
          const star = child as Phaser.Physics.Arcade.Sprite;
          star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        // Create bombs group
        this.bombs = this.physics.add.group();

        // Score text
        this.scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "32px", fill: "#000" });

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);
      }

      update() {
        if (this.gameOver) return;

        if (this.cursors.left?.isDown) {
          this.player.setVelocityX(-160);
          this.player.anims.play("left", true);
        } else if (this.cursors.right?.isDown) {
          this.player.setVelocityX(160);
          this.player.anims.play("right", true);
        } else {
          this.player.setVelocityX(0);
          this.player.anims.play("turn");
        }

        if (this.cursors.up?.isDown && this.player.body.touching.down) {
          this.player.setVelocityY(-330);
        }
      }

      collectStar = (player: Phaser.GameObjects.GameObject, star: Phaser.GameObjects.GameObject) => {
        const collectedStar = star as Phaser.Physics.Arcade.Sprite;
        collectedStar.disableBody(true, true);

        // Update score
        this.score += 10;
        this.scoreText.setText("Score: " + this.score);

        if (this.stars.countActive(true) === 0) {
          // Respawn stars
          this.stars.children.iterate((child) => {
            const star = child as Phaser.Physics.Arcade.Sprite;
            star.enableBody(true, star.x, 0, true, true);
          });

          // Drop a bomb
          const x = this.player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
          const bomb = this.bombs.create(x, 16, "bomb") as Phaser.Physics.Arcade.Sprite;
          bomb.setBounce(1);
          bomb.setCollideWorldBounds(true);
          bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
          bomb.allowGravity = false;
        }
      };

      hitBomb = (player: Phaser.GameObjects.GameObject, bomb: Phaser.GameObjects.GameObject) => {
        this.physics.pause();
        (player as Phaser.Physics.Arcade.Sprite).setTint(0xff0000);
        (player as Phaser.Physics.Arcade.Sprite).anims.play("turn");
        this.gameOver = true;

        // Show the button again when game is over
        setTimeout(() => {
          setShowButton(true);
        }, 1000);
      };
    }

    // Phaser game config
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 1200,
      physics: { default: "arcade", arcade: { gravity: { y: 300 }, debug: false } },
      scene: GameScene,
    };

    if (gameRef.current) {
      gameRef.current.destroy(true);
    }
    
    gameRef.current = new Phaser.Game(config);
  };

  return (
    <div style={{ position: "relative", width: "800px", margin: "100px auto" }}>
      {showButton && (
        <button onClick={startGame} style={buttonConfig.buttonStyle}>
          {buttonConfig.buttonText}
        </button>
      )}
      <div id="game-container"></div>
    </div>
  );
};

export default Game;
