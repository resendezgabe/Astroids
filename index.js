window.onload = function() {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");
    const scoreDiv = document.getElementById("score");

    let player = { x: 100, y: 100, radius: 20, dx: 2, dy: -2, pulse: 0, trail: [] };
    let score = 0;
    let shapes = [];
    let particles = [];
    let gameInterval;
    let level = 1;

    let stars = [];

    // Create a bunch of star objects and add them to the array
    for(let i = 0; i < 200; i++) {
        let star = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5,
            speed: Math.random() * 3 + 1,
        };
        stars.push(star);
    }

    // Create shapes
    for(let i = 0; i < 40; i++) {
        let shape = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 10 + 5,
            opacity: 1,
            isConsumed: false
        };
        shapes.push(shape);
    }

    function update() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        updateStars();
        drawStars();

        // Update player position
        player.x += player.dx;
        player.y += player.dy;

        // Spawn a particle for the player's trail
        let trailParticle = {
            x: player.x,
            y: player.y,
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 2 + 1,
            life: 0.5,
            shrink: 0.01,
            color: "yellow",
        };
        particles.push(trailParticle);

        // Bounce off the walls
        if (player.x + player.radius + player.dx > canvas.width || player.x - player.radius + player.dx < 0) {
            player.dx = -player.dx;
        }

        if (player.y + player.radius + player.dy > canvas.height || player.y - player.radius + player.dy < 0) {
            player.dy = -player.dy;
        }

        // Draw player as an asteroid
        context.beginPath();
        const segments = 30;  // number of segments
        const noise = 3;  // magnitude of noise
        for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            const rad = player.radius + noise * (0.5 - Math.random());
            const x = player.x + rad * Math.cos(theta);
            const y = player.y + rad * Math.sin(theta);
            if (i == 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        context.closePath();
        context.fillStyle = "saddlebrown";
        context.fill();

        // Draw player's trail
        for (let i = 0; i < player.trail.length; i++) {
            let t = player.trail[i];
            context.beginPath();
            context.arc(t.x, t.y, Math.max(0, player.radius), 0, Math.PI * 2, false);
            context.fillStyle = `rgba(255, 165, 0, ${1 - i / player.trail.length})`;
            context.fill();
            context.closePath();
        }

        // Add current position to trail history and remove the oldest one
        player.trail.unshift({ x: player.x, y: player.y });
        if (player.trail.length > 100) {
            player.trail.pop();
        }

        // Draw player with pulsing effect
        context.beginPath();
        context.arc(player.x, player.y, player.radius + Math.sin(player.pulse) * 2, 0, Math.PI * 2, false);
        context.fillStyle = "saddlebrown";
        context.fill();
        context.closePath();

        // Increment pulse more slowly
        player.pulse += 0.01;

        // Check if player's circle has covered the whole canvas
        if (player.radius >= canvas.width / 2 || player.radius >= canvas.height / 2) {
            player.radius = 20;
        }

        // Check if player has reached the level up threshold
        if (player.radius > level * 50) {
            level++;

            // Increase the size of new shapes based on the current level
            for (let i = 0; i < shapes.length; i++) {
                if (!shapes[i].isConsumed) {
                    shapes[i].radius *= 1.5;
                }
            }
        }

        // Draw shapes and handle collision
        for (let i = 0; i < shapes.length; i++) {
            context.beginPath();
            context.arc(shapes[i].x, shapes[i].y, Math.max(0, shapes[i].radius), 0, Math.PI * 2, false);
            context.fillStyle = `rgba(169, 169, 169, ${shapes[i].opacity})`;
            context.fill();
            context.closePath();

            // Collision detection and "consuming" shapes
            if (!shapes[i].isConsumed) {
                let dx = player.x - shapes[i].x;
                let dy = player.y - shapes[i].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < player.radius + shapes[i].radius && player.radius > shapes[i].radius) {
                    shapes[i].isConsumed = true;
                    score++;
                    player.radius += 1;

                    // Create explosion particles
                    for (let j = 0; j < 20; j++) {
                        let particle = {
                            x: shapes[i].x,
                            y: shapes[i].y,
                            dx: (Math.random() - 0.5) * 5,
                            dy: (Math.random() - 0.5) * 5,
                            radius: Math.random() * 2 + 1,
                            life: 1,
                            shrink: 0.03,
                            color: "yellow",
                        };
                        particles.push(particle);
                    }
                }
            }

            // If the shape is marked as consumed, decrease its size and opacity
            if (shapes[i].isConsumed) {
                if (shapes[i].radius > 0.1) {
                    shapes[i].radius -= 0.1;
                    shapes[i].opacity -= 0.01;
                }

                // If the shape has fully disappeared or fully shrunk, respawn it
                if (shapes[i].opacity <= 0 || shapes[i].radius <= 0) {
                    shapes[i] = {
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        radius: Math.abs(Math.random() * 10) + 5,
                        opacity: 1,
                        isConsumed: false
                    };
                }
            }
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];

            // Update position
            p.x += p.dx;
            p.y += p.dy;

            // Decrease life
            p.life -= p.shrink;
            p.radius -= p.shrink;

            // Draw particle
            context.beginPath();
            context.arc(p.x, p.y, Math.max(0, p.radius), 0, Math.PI * 2, false);
            context.fillStyle = p.color;
            context.fill();
            context.closePath();

            // If the particle is dead or too small, remove it
            if (p.life <= 0 || p.radius <= 0) {
                particles.splice(i, 1);
            }
        }

        scoreDiv.innerHTML = `Score: ${score}`;
    }

    function updateStars() {
        for (let i = 0; i < stars.length; i++) {
            stars[i].y += stars[i].speed;

            if (stars[i].y > canvas.height) {
                stars[i].y = 0;
                stars[i].x = Math.random() * canvas.width;
                stars[i].size = Math.random() * 1.5;
                stars[i].speed = Math.random() * 3 + 1;
            }
        }
    }

    function drawStars() {
        for (let i = 0; i < stars.length; i++) {
            context.beginPath();
            context.arc(stars[i].x, stars[i].y, stars[i].size, 0, Math.PI * 2);
            context.fillStyle = "white";
            context.fill();
        }
    }

    // Handle key events for movement
    window.onkeydown = function(e) {
        switch (e.key) {
            case 'ArrowUp':
                player.dy = -2;
                player.dx = 0;
                break;
            case 'ArrowDown':
                player.dy = 2;
                player.dx = 0;
                break;
            case 'ArrowLeft':
                player.dx = -2;
                player.dy = 0;
                break;
            case 'ArrowRight':
                player.dx = 2;
                player.dy = 0;
                break;
        }
    }

    gameInterval = setInterval(update, 1000 / 60);
}