class AdvancedStormSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.cloudCells = [];
        this.currentPhase = 0;

        // Цвета солнца
        this.sunColors = {
            center: 'rgba(210, 211, 125, {opacity})',
            middle: 'rgba(211, 211, 125, {opacity})',
            edge: 'rgba(255, 150, 0, {opacity})'
        };

        this.sunOpacity = 1.0;
        this.cloudOpacity = 0.0;
        this.sunRadius = 60;
        this.sunRays = [];
        this.clusterPoint = null;
        this.groundLevel = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.init();

        
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.centerX = this.canvas.width * 0.3;
        const topPadding = this.canvas.height * 0.26;
        this.centerY = topPadding;
        this.groundLevel = this.canvas.height - 80;
        this.sunX = this.canvas.width * 0.7;
        this.sunY = this.centerY;

        this.createSunRays();
    }

    createSunRays() {
        this.sunRays = [];
        const rayCount = 12;
        const rayLength = this.sunRadius * 1.5;

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const startX = this.sunX + Math.cos(angle) * this.sunRadius;
            const startY = this.sunY + Math.sin(angle) * this.sunRadius;
            const endX = this.sunX + Math.cos(angle) * (this.sunRadius + rayLength);
            const endY = this.sunY + Math.sin(angle) * (this.sunRadius + rayLength);

            this.sunRays.push({
                startX, startY, endX, endY,
                length: rayLength,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    init() {
        this.createCloud();
        this.createInitialParticles();
        this.animate();
    }

    createInitialParticles() {
        this.particles = [];
        for (let i = 0; i < 200; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 1 + Math.random() * 2,
                type: 'dust',
                targetX: null,
                targetY: null,
                inCloud: false,
                mass: 0.5 + Math.random()
            });
        }

        for (let i = 0; i < 120; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 1 + Math.random() * 2,
                type: 'water',
                targetX: null,
                targetY: null,
                inCloud: false,
                mass: 0.5 + Math.random()
            });
        }
    }

    createCloud() {
        this.cloudCells = [];

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 100 + Math.random() * 40;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance * 0.4;
            const size = 60 + Math.random() * 40;

            this.cloudCells.push({ x, y, size });
        }

        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 150;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance * 0.3;
            const size = 30 + Math.random() * 40;

            this.cloudCells.push({ x, y, size });
        }
    }

    checkCloudFormation() {
        if (this.currentPhase === 1) {
            const particlesInCloud = this.particles.filter(p =>
                (p.type === 'dust' || p.type === 'water') && p.inCloud
            ).length;

            const totalParticles = this.particles.filter(p =>
                p.type === 'dust' || p.type === 'water'
            ).length;

            if (totalParticles > 0) {
                const formationRatio = particlesInCloud / totalParticles;
                this.sunOpacity = Math.max(0, 1 - formationRatio * 1.8);
                this.cloudOpacity = Math.min(1, formationRatio * 1.5);
            }
        }
    }

    createIceParticles() {
        this.particles = this.particles.filter(p => !['dust', 'water'].includes(p.type));

        for (let i = 0; i < 50; i++) {
            const cell = this.cloudCells[Math.floor(Math.random() * this.cloudCells.length)];
            this.particles.push({
                x: cell.x + (Math.random() - 0.5) * 80,
                y: cell.y + 40 + Math.random() * 60,
                vx: 0,
                vy: 0,
                radius: 2 + Math.random() * 2,
                type: 'ice_bottom',
                mass: 1.0 + Math.random() * 0.5
            });
        }

        for (let i = 0; i < 35; i++) {
            const cell = this.cloudCells[Math.floor(Math.random() * this.cloudCells.length)];
            this.particles.push({
                x: cell.x + (Math.random() - 0.5) * 80,
                y: cell.y - 40 - Math.random() * 60,
                vx: 0,
                vy: 0,
                radius: 3 + Math.random() * 2,
                type: 'ice_top',
                mass: 2.0 + Math.random()
            });
        }
    }

    separateCharges() {
        this.particles = this.particles.filter(p => p.type.includes('ice'));

        this.particles.forEach(particle => {
            if (particle.mass < 1.5) {
                particle.charge = 1;
                particle.type = 'positive';
            } else {
                particle.charge = -1;
                particle.type = 'negative';
            }
        });
        
    }
triggerLightning() {
    this.lightningActive = true;
    this.lightningTimer = 0;
}

drawLightningScene() {
    const ctx = this.ctx;
    const baseX = this.centerX + 200;
    const baseY = this.groundLevel;
    const treeHeight = 120;
    const treeTopY = baseY - treeHeight;

    // 🌳 Дерево (более живое)
    const trunkGradient = ctx.createLinearGradient(baseX, baseY - treeHeight, baseX, baseY);
    trunkGradient.addColorStop(0, '#5a3c1a');
    trunkGradient.addColorStop(1, '#2f1d0d');
    ctx.fillStyle = trunkGradient;
    ctx.fillRect(baseX - 7, baseY - treeHeight, 14, treeHeight);

    // Крона дерева — объемная, зелёная
    const leafGrad = ctx.createRadialGradient(baseX, baseY - treeHeight - 10, 10, baseX, baseY - treeHeight - 15, 45);
    leafGrad.addColorStop(0, '#3ea832');
    leafGrad.addColorStop(1, '#1c441b');
    ctx.beginPath();
    ctx.arc(baseX, baseY - treeHeight - 10, 40, 0, Math.PI * 2);
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // ⚡ Молния
    if (this.lightningActive) {
        this.lightningTimer++;

        const cloudY = this.centerY + 130; // нижняя часть облака
        const flash = Math.sin(this.lightningTimer * 0.3) * 0.5 + 0.5;

        // рисуем ветвистый канал
        const drawBolt = (x, y, targetY, depth = 0) => {
            if (depth > 6 || y >= targetY) return;
            const segments = 5 + Math.floor(Math.random() * 5);
            const stepY = (targetY - y) / segments;

            let currX = x;
            let currY = y;

            for (let i = 0; i < segments; i++) {
                const nextX = currX + (Math.random() - 0.5) * 40; // зигзаг
                const nextY = currY + stepY + Math.random() * 5;

                ctx.beginPath();
                ctx.moveTo(currX, currY);
                ctx.lineTo(nextX, nextY);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - depth * 0.1})`;
                ctx.lineWidth = 3 - depth * 0.3;
                ctx.stroke();

                // иногда создаем боковые ветви
                if (Math.random() < 0.2 && depth < 3) {
                    drawBolt(nextX, nextY, targetY - 30 - Math.random() * 50, depth + 1);
                }

                currX = nextX;
                currY = nextY;
            }
        };

        // главный ствол молнии
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 20;
        drawBolt(baseX, cloudY, treeTopY);
        ctx.restore();

        // Вспышка по экрану
        if (this.lightningTimer > 10 && this.lightningTimer < 30) {
            const flashAlpha = 0.5 + Math.random() * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Подсветка дерева во время удара
        if (this.lightningTimer < 40) {
            const glow = 0.4 + Math.sin(this.lightningTimer * 0.4) * 0.3;
            ctx.strokeStyle = `rgba(255, 255, 200, ${glow})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(baseX, treeTopY);
            ctx.stroke();
        }

        // Завершение эффекта
        if (this.lightningTimer > 90) {
            this.lightningActive = false;
        }
    }
}



    updateParticles() {
        this.sunRays.forEach(ray => {
            ray.pulse += 0.05;
        });

        this.particles.forEach(particle => {
            if (this.currentPhase === 0 && (particle.type === 'dust' || particle.type === 'water')) {
                particle.vx += (Math.random() - 0.5) * 0.15;
                particle.vy += (Math.random() - 0.5) * 0.15;

                const maxIdleSpeed = 1.6;
                const sp = Math.hypot(particle.vx, particle.vy);
                if (sp > maxIdleSpeed) {
                    particle.vx = (particle.vx / sp) * maxIdleSpeed;
                    particle.vy = (particle.vy / sp) * maxIdleSpeed;
                }

                if (particle.x < 0) { particle.x = 0; particle.vx *= -0.8; }
                if (particle.x > this.canvas.width) { particle.x = this.canvas.width; particle.vx *= -0.8; }
                if (particle.y > this.groundLevel - 5) { particle.y = this.groundLevel - 5; particle.vy *= -0.6; }
            }

            if (this.currentPhase === 1 && !particle.inCloud &&
                (particle.type === 'dust' || particle.type === 'water')) {
                if (particle.targetX === null) {
                    const targetCell = this.cloudCells[Math.floor(Math.random() * this.cloudCells.length)];
                    particle.targetX = targetCell.x + (Math.random() - 0.5) * targetCell.size;
                    particle.targetY = targetCell.y + (Math.random() - 0.5) * targetCell.size * 0.5;
                }

                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 8) {
                    particle.inCloud = true;
                    particle.vx = 0;
                    particle.vy = 0;
                } else {
                    particle.vx += dx * 0.02;
                    particle.vy += dy * 0.02;

                    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                    if (speed > 3) {
                        particle.vx = (particle.vx / speed) * 3;
                        particle.vy = (particle.vy / speed) * 3;
                    }
                }
            }

            if (this.currentPhase === 3 && (particle.type === 'positive' || particle.type === 'negative')) {
                if (particle.type === 'positive') {
                    particle.vy -= 0.1;
                    particle.y = Math.max(this.centerY - 100, particle.y);
                } else if (particle.type === 'negative') {
                    particle.vy += 0.1;
                    particle.y = Math.min(this.centerY + 100, particle.y);
                }

                particle.vx += (Math.random() - 0.5) * 0.3;
                particle.vy += (Math.random() - 0.5) * 0.3;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;

            if (!this.noFriction) { // 👈 проверяем, включено ли замедление
    particle.vx *= 0.95;
    particle.vy *= 0.95;
}

        });

        this.checkCloudFormation();
    }

    drawGround() {
        const gradient = this.ctx.createLinearGradient(0, this.groundLevel, 0, this.canvas.height);
        gradient.addColorStop(0, '#2d5a27');
        gradient.addColorStop(1, '#1e3a1a');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.groundLevel, this.canvas.width, this.canvas.height - this.groundLevel);
    }

    drawSun() {
        if (this.sunOpacity <= 0) return;

        this.ctx.strokeStyle = `rgba(255, 220, 100, ${this.sunOpacity * 0.6})`;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        this.sunRays.forEach(ray => {
            const pulseFactor = 0.8 + Math.sin(ray.pulse) * 0.2;
            const currentLength = ray.length * pulseFactor;
            const endX = this.sunX + (ray.endX - this.sunX) / ray.length * currentLength;
            const endY = this.sunY + (ray.endY - this.sunY) / ray.length * currentLength;

            this.ctx.beginPath();
            this.ctx.moveTo(ray.startX, ray.startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        });

        const sunGradient = this.ctx.createRadialGradient(
            this.sunX, this.sunY, 0,
            this.sunX, this.sunY, this.sunRadius
        );

        sunGradient.addColorStop(0, this.sunColors.center.replace('{opacity}', this.sunOpacity));
        sunGradient.addColorStop(0.7, this.sunColors.middle.replace('{opacity}', this.sunOpacity * 0.8));
        sunGradient.addColorStop(1, this.sunColors.edge.replace('{opacity}', this.sunOpacity * 0.4));

        this.ctx.fillStyle = sunGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.sunX, this.sunY, this.sunRadius, 0, Math.PI * 2);
        this.ctx.fill();

        const glowGradient = this.ctx.createRadialGradient(
            this.sunX, this.sunY, this.sunRadius,
            this.sunX, this.sunY, this.sunRadius * 2
        );
        glowGradient.addColorStop(0, `rgba(255, 200, 50, ${this.sunOpacity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.sunX, this.sunY, this.sunRadius * 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCloud() {
        if (this.cloudOpacity <= 0) return;

        this.cloudCells.forEach(cell => {
            const gradient = this.ctx.createRadialGradient(
                cell.x, cell.y, 0,
                cell.x, cell.y, cell.size
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${0.6 * this.cloudOpacity})`);
            gradient.addColorStop(0.5, `rgba(220, 220, 220, ${0.4 * this.cloudOpacity})`);
            gradient.addColorStop(1, `rgba(180, 180, 180, ${0.2 * this.cloudOpacity})`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * this.cloudOpacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cell.x, cell.y, cell.size, 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            let color;
            switch (particle.type) {
                case 'dust':
                    color = '#a0a0a0';
                    break;
                case 'water':
                    color = '#87ceeb';
                    break;
                case 'ice_bottom':
                    color = '#e6f7ff';
                    break;
                case 'ice_top':
                    color = '#ffffff';
                    break;
                case 'positive':
                    color = '#ff6b6b';
                    break;
                case 'negative':
                    color = '#4ecdc4';
                    break;
                default:
                    color = '#e0e0e0';
            }

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            if (particle.type === 'positive' || particle.type === 'negative') {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(particle.charge > 0 ? '+' : '-', particle.x, particle.y);
            }
        });
    }

    draw() {

        this.ctx.fillStyle = '#3a4c6580';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGround();
        this.drawSun();
        this.drawCloud();
        this.drawParticles();
        if (this.currentPhase === 4) {
    this.drawCapacitorLabels();}
    if (this.currentPhase === 5) {
    this.drawLightningScene();

}

    }

    drawCapacitorLabels() {
    const ctx = this.ctx;

    // Позиции облака
    const cloudTop = this.centerY - 140;
    const cloudBottom = this.centerY + 140;
    const cloudRight = this.centerX + 220;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Единая вертикальная линия справа
    const xRight = cloudRight + 40;

    // Плюс над облаком (справа)
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('+', xRight, this.centerY - 100);

    // Минус под облаком (справа)
    ctx.fillStyle = '#66ccff';
    ctx.fillText('–', xRight, this.centerY + 100);

    // Надпись "Изолятор" в центре облака — желтоватая
    ctx.fillStyle = '#56585eff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Изолятор', this.centerX, this.centerY);

    // Плюс у земли — выровнен по той же вертикали (xRight)
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('+', xRight, this.groundLevel - 40);

    // Надпись "Изолятор" между облаком и землёй (желтоватая)
    ctx.fillStyle = '#ffea80';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Изолятор', this.centerX + 60, this.centerY + 230);

    ctx.restore();
}


    animate() {
        this.updateParticles();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Инициализация симулятора
const canvas = document.getElementById('stormCanvas');
const simulator = new AdvancedStormSimulator(canvas);

// Функция активации фазы
function activatePhase(phaseNumber) {
    document.querySelectorAll('.phase-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`phase${phaseNumber}`).classList.add('active');

    simulator.currentPhase = phaseNumber;

    switch (phaseNumber) {
        case 1:
            simulator.sunOpacity = 1.0;
            simulator.cloudOpacity = 0.0;
            simulator.particles.forEach(particle => {
                if (particle.type === 'dust' || particle.type === 'water') {
                    particle.inCloud = false;
                    particle.targetX = null;
                    particle.targetY = null;
                }
            });
            break;
        case 2:
            simulator.sunOpacity = 0.0;
            simulator.cloudOpacity = 1.0;
            simulator.createIceParticles();
            break;
        case 3:
    simulator.sunOpacity = 0.0;
    simulator.cloudOpacity = 1.0;

    // Радиус границы облака
    const cloudRadius = 180;

    // 💨 Этап 1: быстрое перемешивание частиц внутри облака
    simulator.particles.forEach(particle => {
        if (particle.type.includes('ice')) {
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;

            // Сохраняем центр облака как точку "привязки"
            particle.centerX = simulator.centerX;
            particle.centerY = simulator.centerY;
            particle.boundRadius = cloudRadius;
        }
    });

    simulator.noFriction = true;

    // ⏱  Обновляем координаты с удержанием внутри облака
    const mixInterval = setInterval(() => {
        simulator.particles.forEach(particle => {
            if (particle.type.includes('ice')) {
                const dx = particle.x - particle.centerX;
                const dy = particle.y - particle.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Если частица вышла за границу — отбрасываем обратно
                if (dist > particle.boundRadius) {
                    const angle = Math.atan2(dy, dx);
                    particle.x = particle.centerX + Math.cos(angle) * particle.boundRadius * 0.95;
                    particle.y = particle.centerY + Math.sin(angle) * particle.boundRadius * 0.95;
                    particle.vx *= -0.7;
                    particle.vy *= -0.7;
                }
            }
        });
    }, 16); // ~60 FPS

    // ⚡ Через 1.5 секунды — разделение зарядов
    setTimeout(() => {
        clearInterval(mixInterval);
        simulator.noFriction = false;
        simulator.separateCharges();
    }, 1500);
    break;

case 4:
    simulator.sunOpacity = 0.0;
    simulator.cloudOpacity = 1.0;
    simulator.currentPhase = 4;
    break;

    case 5:
    simulator.sunOpacity = 0.0;
    simulator.cloudOpacity = 1.0;
    simulator.triggerLightning();
    break;


    }
}
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 40, // 👈 отступ, чтобы не пряталось под меню
                behavior: 'smooth'
            });
        }
    });
});

