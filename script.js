        class AdvancedStormSimulator {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.particles = [];
                this.cloudCells = [];
                this.currentPhase = 0;
                this.groundLevel = 0;
                
                this.resize();
                window.addEventListener('resize', () => this.resize());
                
                this.init();
            }
            
            resize() {
                this.canvas.width = this.canvas.parentElement.clientWidth;
                this.canvas.height = this.canvas.parentElement.clientHeight;
                this.centerX = this.canvas.width * 0.3;
                const topPadding = 140; // отступ от верхнего края
                this.centerY = topPadding;
                this.groundLevel = this.canvas.height - 100;
            }
            
            init() {
                this.createCloud();
  this.createInitialParticles();
  this.animate();
            }
            
            createInitialParticles() {
                this.particles = [];
                // Создаем частицы пыли и воды по всему экрану
                for (let i = 0; i < 150; i++) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: 2 + Math.random() * 3,
                        type: 'dust',
                        targetX: null,
                        targetY: null,
                        inCloud: false,
                        mass: 0.5 + Math.random()
                    });
                }
                
                for (let i = 0; i < 100; i++) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: 2 + Math.random() * 2,
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
                
                // Основное тело облака слева
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const distance = 100 + Math.random() * 40;
                    const x = this.centerX + Math.cos(angle) * distance;
                    const y = this.centerY + Math.sin(angle) * distance * 0.4;
                    const size = 60 + Math.random() * 40;
                    
                    this.cloudCells.push({ x, y, size });
                }
                
                // Дополнительные ячейки
                for (let i = 0; i < 8; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = Math.random() * 150;
                    const x = this.centerX + Math.cos(angle) * distance;
                    const y = this.centerY + Math.sin(angle) * distance * 0.3;
                    const size = 30 + Math.random() * 40;
                    
                    this.cloudCells.push({ x, y, size });
                }
            }
            
            createIceParticles() {
                // Льдинки снизу (меньшие)
                for (let i = 0; i < 40; i++) {
                    const cell = this.cloudCells[Math.floor(Math.random() * this.cloudCells.length)];
                    this.particles.push({
                        x: cell.x + (Math.random() - 0.5) * 80,
                        y: cell.y + 50 + Math.random() * 60,
                        vx: 0,
                        vy: 0,
                        radius: 3 + Math.random() * 2,
                        type: 'ice_bottom',
                        mass: 1.0 + Math.random() * 0.5
                    });
                }
                
                // Градины сверху (крупные)
                for (let i = 0; i < 30; i++) {
                    const cell = this.cloudCells[Math.floor(Math.random() * this.cloudCells.length)];
                    this.particles.push({
                        x: cell.x + (Math.random() - 0.5) * 80,
                        y: cell.y - 50 - Math.random() * 60,
                        vx: 0,
                        vy: 0,
                        radius: 5 + Math.random() * 3,
                        type: 'ice_top', 
                        mass: 2.0 + Math.random()
                    });
                }
            }
            
            separateCharges() {
                // Удаляем старые частицы пыли и воды
                this.particles = this.particles.filter(p => p.type.includes('ice'));
                
                // Разделяем заряды
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
            
            updateParticles() {
                this.particles.forEach(particle => {
                    // Фаза 1: частицы летят в облако
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
                        
                        if (distance < 5) {
                            particle.inCloud = true;
                            particle.vx = 0;
                            particle.vy = 0;
                        } else {
                            particle.vx += dx * 0.02;
                            particle.vy += dy * 0.02;
                            
                            // Ограничиваем скорость
                            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                            if (speed > 3) {
                                particle.vx = (particle.vx / speed) * 3;
                                particle.vy = (particle.vy / speed) * 3;
                            }
                        }
                    }
                    
                    // Фаза 3: разделение зарядов
                    if (this.currentPhase === 3 && (particle.type === 'positive' || particle.type === 'negative')) {
                        if (particle.type === 'positive') {
                            particle.vy -= 0.1;
                            // Ограничиваем сверху
                            particle.y = Math.max(this.centerY - 200, particle.y);
                        } else if (particle.type === 'negative') {
                            particle.vy += 0.1;
                            // Ограничиваем снизу
                            particle.y = Math.min(this.centerY + 200, particle.y);
                        }
                        
                        // Турбулентность
                        particle.vx += (Math.random() - 0.5) * 0.3;
                        particle.vy += (Math.random() - 0.5) * 0.3;
                    }
                    
                    // Обновление позиции
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // Демпфирование
                    particle.vx *= 0.95;
                    particle.vy *= 0.95;
                });
            }
            
            drawGround() {
                const gradient = this.ctx.createLinearGradient(0, this.groundLevel, 0, this.canvas.height);
                gradient.addColorStop(0, '#2d5a27');
                gradient.addColorStop(1, '#1e3a1a');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, this.groundLevel, this.canvas.width, this.canvas.height - this.groundLevel);
            }
            
            drawCloud() {
                this.cloudCells.forEach(cell => {
                    const gradient = this.ctx.createRadialGradient(
                        cell.x, cell.y, 0,
                        cell.x, cell.y, cell.size
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                    gradient.addColorStop(0.5, 'rgba(220, 220, 220, 0.4)');
                    gradient.addColorStop(1, 'rgba(180, 180, 180, 0.2)');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(cell.x, cell.y, cell.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Контур облака
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(cell.x, cell.y, cell.size, 0, Math.PI * 2);
                    this.ctx.stroke();
                });
            }
            
            drawParticles() {
                this.particles.forEach(particle => {
                    let color;
                    switch(particle.type) {
                        case 'dust':
                            color = '#888888';
                            break;
                        case 'water':
                            color = '#4fc3f7';
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
                    
                    // Обводка для лучшей видимости
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    
                    // Подписи для заряженных частиц
                    if (particle.type === 'positive' || particle.type === 'negative') {
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.font = 'bold 12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(particle.charge > 0 ? '+' : '-', particle.x, particle.y);
                    }
                });
            }
            
            draw() {
                // Очистка canvas
                this.ctx.fillStyle = '#0a1128';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Рисуем землю и облако
                this.drawGround();
                this.drawCloud();
                
                this.drawParticles();
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
            // Убираем активный класс со всех фаз
            document.querySelectorAll('.phase-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Добавляем активный класс к выбранной фазе
            document.getElementById(`phase${phaseNumber}`).classList.add('active');
            
            simulator.currentPhase = phaseNumber;
            
            switch(phaseNumber) {
                case 1:
                    // Активируем анимацию движения частиц в облако
                    simulator.particles.forEach(particle => {
                        if (particle.type === 'dust' || particle.type === 'water') {
                            particle.inCloud = false;
                            particle.targetX = null;
                            particle.targetY = null;
                        }
                    });
                    break;
                case 2:
                    // Создаем льдинки и градины
                    simulator.createIceParticles();
                    break;
                case 3:
                    // Разделение зарядов
                    simulator.separateCharges();
                    break;
            }
        }

        // Автоматически активируем первую фазу при загрузке
        setTimeout(() => {
            activatePhase(1);
        }, 500);