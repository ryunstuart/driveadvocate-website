<<<<<<< HEAD
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DoShaggy’s Burgers • Fries • Shakes | Now Franchising Nationwide</title>
    <meta name="description" content="Premium burgers, beef tallow fries, chicken sandwiches & hand-scooped shakes in St. Charles & O'Fallon, MO. Now franchising nationwide.">

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="icon" type="image/png" href="favicon.png">

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        .tail-container * { font-family: 'Inter', system_ui, sans-serif; }
        .logo-font { font-family: 'Space Grotesk', sans-serif; }

        .hero-bg {
            background-image: linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url('hero.png');
            background-size: cover;
            background-position: center 30%;
            height: 75vh;
            min-height: 520px;
            display: flex;
            align-items: center;
        }

        @media (max-width: 768px) {
            .hero-bg {
                height: 85vh;
                min-height: 520px;
                background-position: center 40%;
                background-attachment: scroll;
            }
        }

        .side-menu { 
            opacity: 0; 
            visibility: hidden; 
            transition: all 0.4s ease;
            top: 130px;           /* ← Increased to fix overlap with header */
        }
        .side-menu.visible {
            opacity: 1;
            visibility: visible;
        }

        .floating-icon-bg { 
            background-color: #f9f9f9; 
            width: 68px; 
            height: 68px; 
            padding: 10px; 
            border: 2px solid #9b1c2c;
        }
        .floating-image { 
            width: 48px; 
            height: 48px; 
            object-fit: contain; 
        }

        .menu-card, .testimonial-card {
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            transition: all 0.3s ease;
        }
        .menu-card:hover, .testimonial-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }

        .menu-badge {
            position: absolute;
            top: 16px;
            left: 16px;
            background: #111827;
            color: white;
            padding: 5px 16px 5px 20px;
            font-size: 0.75rem;
            font-weight: 700;
            border-radius: 0 9999px 9999px 0;
            box-shadow: 4px 4px 12px rgba(0,0,0,0.2);
            z-index: 10;
            transform: rotate(-8deg);
        }

        .real-food-image {
            width: 100%;
            height: 260px;
            object-fit: cover;
        }

        /* Buffer for side menu */
        @media (min-width: 1280px) {
            #menu { 
                padding-left: 220px !important; 
            }
        }
    </style>
</head>
<body class="tail-container">

    <!-- NAV -->
    <nav class="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div class="max-w-screen-2xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="index.html" class="flex items-center gap-x-3">
                <img src="logo.png" alt="DoShaggy’s Logo" class="h-10 w-auto">
                <div class="logo-font text-2xl font-bold tracking-[-1px] text-[#9b1c2c]">DoShaggy’s</div>
            </a>

            <div class="hidden md:flex items-center gap-x-8 text-sm font-medium">
                <a href="#menu" class="hover:text-[#9b1c2c]">MENU</a>
                <a href="#locations" class="hover:text-[#9b1c2c]">LOCATIONS</a>
                <a href="franchise.html" class="hover:text-[#9b1c2c]">FRANCHISE</a>
                <a href="catering.html" class="hover:text-[#9b1c2c]">CATERING</a>
                <a href="fundraising.html" class="hover:text-[#9b1c2c]">FUNDRAISING</a>
                <a href="#contact" class="hover:text-[#9b1c2c]">ORDER ONLINE</a>
            </div>

            <div class="flex items-center gap-x-3">
                <a href="franchise.html" class="hidden sm:block px-5 py-2.5 bg-[#9b1c2c] hover:bg-black text-white text-sm font-semibold rounded-2xl">FRANCHISE</a>
                <button onclick="alert('Order button works! Real ordering coming soon.')" class="px-6 py-2.5 bg-black hover:bg-[#9b1c2c] text-white text-sm font-semibold rounded-2xl">ORDER NOW</button>
                <button id="mobile-menu-btn" class="md:hidden text-3xl text-[#9b1c2c]"><i class="fa-solid fa-bars"></i></button>
            </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden bg-white border-t py-4 px-6">
            <div class="flex flex-col gap-y-4 text-lg font-medium">
                <a href="#menu" class="py-2">MENU</a>
                <a href="#locations" class="py-2">LOCATIONS</a>
                <a href="franchise.html" class="py-2">FRANCHISE</a>
                <a href="catering.html" class="py-2">CATERING</a>
                <a href="fundraising.html" class="py-2">FUNDRAISING</a>
                <a href="#contact" class="py-2">ORDER ONLINE</a>
            </div>
        </div>
    </nav>

    <!-- HERO -->
    <header class="hero-bg text-white flex items-center relative overflow-hidden">
        <div class="max-w-screen-2xl mx-auto px-6 w-full text-center md:text-left">
            <div class="inline-flex items-center gap-x-2 bg-white/10 backdrop-blur-md px-8 py-3 rounded-3xl mb-6 mx-auto md:mx-0">
                <span class="uppercase tracking-[3px] text-sm font-medium">NOW FRANCHISING NATIONWIDE • 2 LOCATIONS OPEN</span>
            </div>
            <h1 class="text-4xl md:text-5xl lg:text-6xl xl:text-[4.4rem] font-bold logo-font leading-none tracking-[-2px] mb-4">
                BURGERS.<br>FRIES.<br>SHAKES.<br><span class="text-[#f8d7a3]">ON WHEELS.</span>
            </h1>
            <p class="text-lg md:text-xl max-w-2xl mx-auto md:mx-0 mb-8">Premium fast-casual done right. Beef tallow fries that people drive for.</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <a href="franchise.html" class="px-10 py-6 bg-white text-[#9b1c2c] rounded-3xl text-xl font-semibold hover:bg-gray-100">BECOME A FRANCHISEE →</a>
                <a href="#contact" class="px-10 py-6 border-2 border-white hover:bg-white hover:text-[#9b1c2c] text-xl font-semibold rounded-3xl">ORDER ONLINE</a>
            </div>
        </div>
    </header>

    <!-- TRUST BAR -->
    <div class="trust-bar py-4 border-b">
        <div class="max-w-screen-2xl mx-auto px-6 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm">
            <div class="flex items-center gap-x-2">
                <span class="text-3xl text-yellow-400">★★★★★</span>
                <span class="font-bold text-xl">4.9</span>
                <span class="text-gray-600">(112+ reviews)</span>
            </div>
            <div class="hidden md:block h-5 w-px bg-gray-300"></div>
            
            <div class="flex items-center gap-x-1.5 text-gray-700 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4285F4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.25 1.3-.98 2.4-2.07 3.14v2.58h3.34c1.95-1.8 3.07-4.44 3.07-7.48z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.34-2.58c-.93.63-2.12 1-3.94 1-3.03 0-5.6-2.05-6.52-4.8H1.4v3.02C3.3 20.7 7.4 23 12 23z"/><path d="M5.48 14.3c-.3-.9-.47-1.85-.47-2.8 0-.95.17-1.9.47-2.8V6.1H1.4C.5 7.9 0 9.9 0 12s.5 4.1 1.4 5.9l4.08-3.6z"/><path d="M12 4.7c1.7 0 3.22.6 4.4 1.57l3.3-3.3C17.46 1.3 14.9 0 12 0 7.4 0 3.3 2.3 1.4 6.1L5.48 9.7c.92-2.75 3.5-4.8 6.52-4.8z"/></svg>
                <span>Google</span>
            </div>
            
            <div class="flex items-center gap-x-1.5 text-gray-700 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF0000"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2z"/></svg>
                <span>Yelp</span>
            </div>
            
            <div class="flex items-center gap-x-1.5 text-gray-700 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15h-2v-3h2V9.5C10 7.67 11.67 6 13.5 6H16v3h-2v3h2v3.8c4.56-.93 8-4.96 8-9.8z"/></svg>
                <span>Facebook</span>
            </div>

            <div class="italic text-gray-700">"Best burgers in the St. Louis area by far!"</div>
        </div>
    </div>

    <!-- SIDE MENU -->
    <div id="side-menu" class="hidden xl:flex fixed left-8 z-50 flex-col gap-y-8 side-menu">
        <a href="#burgers" class="group flex flex-col items-center gap-y-1">
            <div class="floating-icon-bg rounded-3xl shadow-xl flex items-center justify-center"><img src="burger.png" alt="Burgers" class="floating-image"></div>
            <span class="text-xs font-medium text-[#9b1c2c]">BURGERS</span>
        </a>
        <a href="#chicken" class="group flex flex-col items-center gap-y-1">
            <div class="floating-icon-bg rounded-3xl shadow-xl flex items-center justify-center"><img src="chicken.png" alt="Chicken" class="floating-image"></div>
            <span class="text-xs font-medium text-[#9b1c2c]">CHICKEN</span>
        </a>
        <a href="#fries" class="group flex flex-col items-center gap-y-1">
            <div class="floating-icon-bg rounded-3xl shadow-xl flex items-center justify-center"><img src="fries.png" alt="Fries" class="floating-image"></div>
            <span class="text-xs font-medium text-[#9b1c2c]">FRIES</span>
        </a>
        <a href="#shakes" class="group flex flex-col items-center gap-y-1">
            <div class="floating-icon-bg rounded-3xl shadow-xl flex items-center justify-center"><img src="shake.png" alt="Shakes" class="floating-image"></div>
            <span class="text-xs font-medium text-[#9b1c2c]">SHAKES</span>
        </a>
    </div>

    <!-- MENU -->
	<section id="menu" class="max-w-screen-2xl mx-auto px-8 py-20 bg-white">
        <h2 class="text-5xl md:text-6xl logo-font text-center mb-12">Our Menu Hits Different</h2>

        <!-- Burgers -->
        <div id="burgers" class="mb-16">
            <h3 class="text-4xl font-bold text-center mb-10">Burgers</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="menu-card relative">
                    <span class="menu-badge">LIMITED TIME ONLY</span>
                    <img src="shaggy-original.png" alt="Shaggy Original" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Shaggy Original</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$14.88</p>
                        <p class="text-gray-600 mt-2 text-sm">Double American cheese, grilled onions, pickles & Shaggy sauce</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <span class="menu-badge bg-[#9b1c2c]">NEW</span>
                    <img src="flippin-frisco.png" alt="Flippin Frisco" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Flippin Frisco</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$13.80</p>
                        <p class="text-gray-600 mt-2 text-sm">Double Swiss American cheese, 1000 island on sourdough</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <img src="spicy-af.png" alt="Spicy A/F" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Spicy A/F</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$11.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Double With Carolina Reaper, Pepper Jack Cheese, Jalapenos, Lettuce, Tomato, and Mayo</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <span class="menu-badge">NEW</span>
                    <img src="shroom-swiss.png" alt="Shroom & Swiss" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Shroom & Swiss</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$15.49</p>
                        <p class="text-gray-600 mt-2 text-sm">Double With Swiss and Mushrooms</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <img src="break-an-egg.png" alt="Break An Egg" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Break An Egg</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$14.49</p>
                        <p class="text-gray-600 mt-2 text-sm">Double American, Fried Egg, Lettuce, Tomato, and Mayo</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chicken -->
        <div id="chicken" class="mb-16">
            <h3 class="text-4xl font-bold text-center mb-10">Chicken</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="menu-card relative">
                    <span class="menu-badge">NEW</span>
                    <img src="fryd-chicken-sandwich.png" alt="FRYD Chicken Sandwich" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">FRYD Chicken Sandwich</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$14.88</p>
                        <p class="text-gray-600 mt-2 text-sm">Crispy fried chicken, pickles, slaw, spicy mayo on brioche</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <img src="chick-pig-ranch.png" alt="Chick Pig Ranch" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Chick Pig Ranch</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$12.49</p>
                        <p class="text-gray-600 mt-2 text-sm">Grilled Chicken, Bacon, Provolone on 7" Hoagie</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <span class="menu-badge">NEW</span>
                    <img src="cheese-steak-mafia.png" alt="Cheese Steak Mafia" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Cheese Steak Mafia</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$13.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Grilled Steak, peppers & onions, Provolone on Garlic Hoagie</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fries -->
        <div id="fries" class="mb-16">
            <h3 class="text-4xl font-bold text-center mb-10">Fries</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="menu-card relative">
                    <img src="beef-tallow-fries.jpg" alt="Beef Tallow Fries" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Beef Tallow Fries</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$5.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Crispy hand-cut fries cooked in real beef tallow</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <span class="menu-badge">NEW</span>
                    <img src="beef-tallow-cheese-fries.jpg" alt="Beef Tallow Cheese Fries" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Beef Tallow Cheese Fries</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$7.49</p>
                        <p class="text-gray-600 mt-2 text-sm">Beef tallow fries topped with melted cheese sauce</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <img src="onion-rings.jpg" alt="Onion Rings" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Onion Rings</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$8.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Crispy battered onion rings</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shakes -->
        <div id="shakes" class="mb-16">
            <h3 class="text-4xl font-bold text-center mb-10">Shakes</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="menu-card relative">
                    <span class="menu-badge">LIMITED TIME ONLY</span>
                    <img src="https://picsum.photos/id/431/800/600" alt="Choc Shake" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Choc Shake</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$6.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Hand-scooped vanilla ice cream, chocolate syrup, and milk</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <span class="menu-badge">NEW</span>
                    <img src="https://picsum.photos/id/870/800/600" alt="Cookie Shake" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Cookie Shake</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$6.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Vanilla ice cream blended with crushed Oreo cookies</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <img src="https://picsum.photos/id/106/800/600" alt="Key Lime Slide" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Key Lime Slide</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$6.99</p>
                        <p class="text-gray-600 mt-2 text-sm">Fresh key lime ice cream with whipped cream</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <span class="menu-badge">NEW</span>
                    <img src="https://picsum.photos/id/431/800/600" alt="Vanilla Shake" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Vanilla Shake</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$7.49</p>
                        <p class="text-gray-600 mt-2 text-sm">Classic vanilla with whipped cream & cherry</p>
                    </div>
                </div>
                <div class="menu-card relative">
                    <img src="https://picsum.photos/id/292/800/600" alt="Strawberry Shake" class="real-food-image">
                    <div class="p-6">
                        <h4 class="text-2xl font-semibold mb-1">Strawberry Shake</h4>
                        <p class="text-[#9b1c2c] font-medium text-lg">$7.49</p>
                        <p class="text-gray-600 mt-2 text-sm">Blended with fresh strawberries</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- TESTIMONIALS -->
    <section id="testimonials" class="max-w-screen-2xl mx-auto px-8 py-20 bg-gray-50">
        <h2 class="text-5xl md:text-6xl logo-font text-center mb-16">What Our Customers Say</h2>
        <div class="grid md:grid-cols-3 gap-8">
            <div class="testimonial-card p-8">
                <div class="flex gap-1 text-yellow-400 mb-6">★★★★★</div>
                <p class="italic text-gray-700">"The beef tallow fries are actually addictive. Best burger I've had in Missouri. We drive 30 minutes just for these."</p>
                <div class="mt-8 flex items-center gap-4">
                    <img src="https://picsum.photos/id/64/80/80" alt="" class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <div class="font-semibold">Sarah Martinez</div>
                        <div class="text-sm text-gray-500">St. Charles, MO</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card p-8">
                <div class="flex gap-1 text-yellow-400 mb-6">★★★★★</div>
                <p class="italic text-gray-700">"The Shaggy Original is my go-to. The shakes are insane too. This place is going to blow up."</p>
                <div class="mt-8 flex items-center gap-4">
                    <img src="https://picsum.photos/id/91/80/80" alt="" class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <div class="font-semibold">Mike Thompson</div>
                        <div class="text-sm text-gray-500">O'Fallon, MO</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card p-8">
                <div class="flex gap-1 text-yellow-400 mb-6">★★★★★</div>
                <p class="italic text-gray-700">"Finally a burger joint that gets the fries right. The whole family loves it."</p>
                <div class="mt-8 flex items-center gap-4">
                    <img src="https://picsum.photos/id/201/80/80" alt="" class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <div class="font-semibold">Jessica Ramirez</div>
                        <div class="text-sm text-gray-500">St. Peters, MO</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CATERING TEASER -->
    <section class="max-w-screen-2xl mx-auto px-8 py-20 bg-white border-t border-b">
        <div class="grid md:grid-cols-2 gap-12 items-center">
            <div>
                <h2 class="text-5xl md:text-6xl logo-font mb-6">Catering That Hits Different</h2>
                <p class="text-xl text-gray-600 mb-8">From backyard parties to corporate events — our famous burgers, beef tallow fries, and shakes travel well and make every event a hit.</p>
                <a href="catering.html" class="inline-block px-10 py-5 bg-[#9b1c2c] text-white text-xl font-semibold rounded-3xl hover:bg-black">VIEW CATERING MENU →</a>
            </div>
            <div class="rounded-3xl overflow-hidden">
                <img src="catering.jpg" alt="DoShaggy’s Catering" class="w-full h-full object-cover">
            </div>
        </div>
    </section>

    <!-- LOCATIONS -->
    <section id="locations" class="max-w-screen-2xl mx-auto px-8 py-20 bg-white">
        <h2 class="text-5xl md:text-6xl logo-font text-center mb-12">Our Locations</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border">
                <div class="h-64">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3100.8!2d-90.5234!3d38.7801!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s1981+Zumbehl+Rd%2C+St.+Charles%2C+MO+63303!5e0!3m2!1sen!2sus!4v1740000000000" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>
                <div class="p-8">
                    <h3 class="text-3xl font-semibold">St. Charles, MO</h3>
                    <p class="text-gray-600">1981 Zumbehl Road<br>St. Charles, MO 63303</p>
                    <p class="mt-3 text-[#9b1c2c] font-medium">(636) 555-1234</p>
                    <p class="text-green-600 font-medium mt-4">Now Open Daily • 11AM - 10PM</p>
                </div>
            </div>
            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border">
                <div class="h-64">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3101.2!2d-90.712!3d38.785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sHwy+P+%26+Main+St%2C+O'Fallon%2C+MO+63366!5e0!3m2!1sen!2sus!4v1740000000000" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>
                <div class="p-8">
                    <h3 class="text-3xl font-semibold">O'Fallon, MO</h3>
                    <p class="text-gray-600">Hwy P & Main St<br>O'Fallon, MO 63366</p>
                    <p class="mt-4 text-amber-600 font-medium">Coming Soon</p>
                </div>
            </div>
            <div class="bg-white rounded-3xl overflow-hidden shadow-sm border">
                <div class="h-64">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3102.5!2d-90.45!3d38.62!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s10463+Manchester+Rd%2C+MO!5e0!3m2!1sen!2sus!4v1740000000000" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                </div>
                <div class="p-8">
                    <h3 class="text-3xl font-semibold">Manchester Road</h3>
                    <p class="text-gray-600">10463 Manchester Road<br>St. Louis Area, MO</p>
                    <p class="mt-4 text-amber-600 font-medium">Coming Soon</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" class="max-w-screen-2xl mx-auto px-8 py-20 bg-gray-50">
        <div class="max-w-2xl mx-auto text-center">
            <h2 class="text-5xl md:text-6xl logo-font mb-6">Order Online or Get In Touch</h2>
            <p class="text-xl text-gray-600 mb-12">Delivery or questions — we're happy to help.</p>
            <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-white rounded-3xl p-10 shadow-sm">
                    <h3 class="text-2xl font-semibold mb-6">Order Delivery</h3>
                    <div class="space-y-4">
                        <button onclick="alert('DoorDash integration coming soon!')" class="block w-full py-4 bg-orange-500 text-white rounded-2xl font-medium">DoorDash</button>
                        <button onclick="alert('Uber Eats integration coming soon!')" class="block w-full py-4 bg-black text-white rounded-2xl font-medium">Uber Eats</button>
                    </div>
                </div>
                <div class="bg-white rounded-3xl p-10 shadow-sm">
                    <h3 class="text-2xl font-semibold mb-6">Send a Message</h3>
                    <form class="space-y-6">
                        <input type="text" placeholder="Your Name" class="w-full px-6 py-4 border border-gray-300 rounded-2xl">
                        <input type="email" placeholder="Email Address" class="w-full px-6 py-4 border border-gray-300 rounded-2xl">
                        <textarea placeholder="How can we help you?" rows="4" class="w-full px-6 py-4 border border-gray-300 rounded-3xl"></textarea>
                        <button type="button" onclick="alert('Thank you! Message received (demo)')" class="w-full bg-[#9b1c2c] hover:bg-black text-white py-5 rounded-3xl font-semibold">SEND MESSAGE</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- FRANCHISE TEASER -->
    <section id="franchise" class="bg-[#111827] text-white pt-24 pb-0">
        <div class="max-w-screen-2xl mx-auto px-8 text-center">
            <h2 class="text-5xl md:text-6xl logo-font leading-tight">Join the DoShaggy’s Family.<br>Franchising Now Open Nationwide.</h2>
            <p class="mt-6 text-xl max-w-xl mx-auto">Two successful locations. Loyal customers. Full training and support.</p>
            <div class="mt-12">
                <a href="franchise.html" class="inline-block px-16 py-7 bg-white text-[#9b1c2c] text-3xl font-bold rounded-3xl hover:bg-gray-100">START YOUR FRANCHISE JOURNEY →</a>
            </div>
        </div>
    </section>

    <footer class="bg-black text-white py-12 text-center">
        <p>© <span id="current-year"></span> DoShaggy’s • St. Charles, Missouri</p>
    </footer>

    <script>
        document.getElementById('current-year').textContent = new Date().getFullYear();

        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        const sideMenu = document.getElementById('side-menu');
        function checkScroll() {
            const menuRect = document.getElementById('menu').getBoundingClientRect();
            const testimonialsRect = document.getElementById('testimonials').getBoundingClientRect();
            if (menuRect.top <= 140 && testimonialsRect.top > 520) {
                sideMenu.classList.add('visible');
            } else {
                sideMenu.classList.remove('visible');
            }
        }
        window.addEventListener('scroll', checkScroll);
        setTimeout(checkScroll, 400);
    </script>
</body>
</html>
=======

>>>>>>> 6f7ac4d52da6cd9d648cafc095523377c8097b27
