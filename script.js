import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ⚠️ PASTE YOUR CONFIG FROM FIREBASE HERE:
const firebaseConfig = {
  apiKey: "AIzaSyCnFbgiJbktWlTAh5ctFyQpnyDHkrjbj1s",
  authDomain: "lmandalas.firebaseapp.com",
  projectId: "lmandalas",
  storageBucket: "lmandalas.firebasestorage.app",
  messagingSenderId: "252825804558",
  appId: "1:252825804558:web:1d532fc75af2de9eeb415f",
  measurementId: "G-9VQ9SJ87ZV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // <── YOU MISSED THIS LINE BRO! ADD IT!

// Handle the Form Submit
document.getElementById('authForm').addEventListener('submit', (e) => {
  e.preventDefault(); // Stop page reload
  
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const errorMsg = document.getElementById('authErrorMessage');
  errorMsg.innerText = ""; // Clear old errors

  if (isSignUp) {
    // CREATE ACCOUNT LOGIC
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Account Created!", userCredential.user);
        closeLoginBtn.click(); // Close modal on success
      })
      .catch((error) => {
        errorMsg.innerText = error.message.replace("Firebase: ", "");
      });
  } else {
    // SIGN IN LOGIC
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Signed In!", userCredential.user);
        closeLoginBtn.click(); // Close modal on success
      })
      .catch((error) => {
        errorMsg.innerText = "Invalid credentials. Please try again.";
      });
  }
});

// Listen for Login State Changes (Optional: Update UI when logged in)
// ── LISTEN FOR LOGIN STATE CHANGES ──
onAuthStateChanged(auth, async (user) => {
  const navLoginText = document.querySelector('#openLoginBtn span');
  const authFormContainer = document.getElementById('authFormContainer');
  const loggedInContainer = document.getElementById('loggedInContainer');
  const loggedInUserEmail = document.getElementById('loggedInUserEmail');

  if (user) {
    const emailName = user.email.split('@')[0];
    navLoginText.innerText = emailName.toUpperCase();
    authFormContainer.style.display = 'none';
    loggedInContainer.style.display = 'block';
    loggedInUserEmail.innerText = user.email;

    // ── NEW: FETCH SAVED CART ──
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists() && docSnap.data().cart) {
        cart = docSnap.data().cart; // Overwrite local cart with saved cart
        updateCartUI(); // Update the screen
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
    
  } else {
    // If logged out, reset the cart to empty so they don't see the previous user's items
    cart = [];
    updateCartUI();
    
    navLoginText.innerText = "LOGIN";
    authFormContainer.style.display = 'block';
    loggedInContainer.style.display = 'none';
  }
});

// ── DASHBOARD ACTIONS ──
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      // Closes the modal smoothly when they log out
      document.getElementById('closeLoginBtn').click(); 
    }).catch((error) => {
      console.error("Logout failed:", error);
    });
  });
}
// ── HERO VIDEO CONTROL LOGIC (INDIGO STYLE) ──
document.addEventListener('DOMContentLoaded', () => {
  const videoToggleBtn = document.getElementById('videoToggleBtn');
  const mainHeroVideo = document.getElementById('mainHeroVideo');

  if (videoToggleBtn && mainHeroVideo) {
    videoToggleBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Stops any weird jumping behavior
      const textSpan = videoToggleBtn.querySelector('.ivb-text');

      if (mainHeroVideo.paused) {
        mainHeroVideo.play();
        textSpan.innerText = "[ || ]";
      } else {
        mainHeroVideo.pause();
        textSpan.innerText = "[ ▶ ]";
      }
    });
  }
});
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    const msgEl = document.getElementById('accountMessage');
    
    if (user) {
      sendPasswordResetEmail(auth, user.email)
        .then(() => {
          msgEl.innerText = "A reset link has been sent to your email.";
          msgEl.style.color = "#2E8B4A"; // Success Green
        })
        .catch((error) => {
          msgEl.innerText = error.message.replace("Firebase: ", "");
          msgEl.style.color = "#C94040"; // Error Red
        });
    }
  });
}
// ── DYNAMIC PRODUCTS (GOOGLE SHEETS) ──
let products = [];
let cart = [];
// ── SYNC CART TO FIREBASE ──
// ── SYNC CART TO FIREBASE WITH SANITIZATION & LOGGING ──
async function syncCartToDB() {
  const user = auth.currentUser;
  
  if (user) {
    console.log("Attempting to save cart to Firestore for user:", user.uid);
    try {
      // THE FIX: This scrubs out any 'undefined' ghost values from Google Sheets
      const cleanCart = JSON.parse(JSON.stringify(cart));

      await setDoc(doc(db, "users", user.uid), {
        cart: cleanCart
      }, { merge: true });
      
      console.log("✅ BOOM! Cart successfully saved to Firestore!", cleanCart);
      
    } catch (error) {
      console.error("❌ Firestore Save Error:", error);
    }
  } else {
    console.warn("⚠️ Cannot save to database: No user is currently logged in.");
  }
}
// ⚠️ PASTE YOUR GOOGLE SHEET CSV URL HERE:
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa3BD2gxSyPhbGzfP6Ixw_8UqDrnngK5_m9b9tOaUS2vzaUKfj9x9VZ1Y1VbmVpbmuxphmJpboXY_C/pub?gid=0&single=true&output=csv';

function fetchProducts() {
  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    complete: function(results) {
      // Map Google Sheets data to our app's format
      products = results.data
  .filter(row => row.name)
  .map((row, index) => {
    const originalPrice = parseInt(row.price) || 0;
    const salePrice = parseInt(row.sale_price) || originalPrice;
    const isOnSale = row.on_sale ? row.on_sale.toLowerCase() === 'yes' : false;

    return {
      id: index + 1,
      name: row.name,
      originalPrice: originalPrice,
      // If on_sale is 'yes', use sale_price, otherwise use original price
      price: isOnSale ? salePrice : originalPrice, 
      isOnSale: isOnSale,
      tag: row.tag,
      description: row.description,
      color: ['#080808', row.color || '#999'], 
      available: row.available ? row.available.toLowerCase() === 'yes' : true,
      image: row.image
    };
  });

      // Now that data is loaded, build the grids
      buildCollections();
      renderShop();
    }
  });
}

// ── BUILD TRUE COLLECTIONS (CATEGORIES) ──
function buildCollections() {
  const collGrid = document.getElementById('collectionsGrid');
  if (!collGrid) return;
  collGrid.innerHTML = ''; 
  
  // 1. Scan the Google Sheet and extract all unique tags (categories)
  const uniqueCategories = [...new Set(products.map(p => p.tag).filter(tag => tag !== ""))];
  
  // 2. Add a "View All" option to the front of the list
  uniqueCategories.unshift("All Artworks");

  // 3. Build a card for each category
  uniqueCategories.forEach((category) => {
    // Find the first product in this category to use as the cover image
    const coverProduct = category === "All Artworks" 
      ? products[0] // Uses the very first product as the "View All" cover
      : products.find(p => p.tag === category);

    if(!coverProduct) return; // Failsafe

    const card = document.createElement('div');
    card.className = 'coll-card category-card'; // Added 'category-card' for the click listener
    card.dataset.category = category; // Stores the category name inside the HTML
    
    // Use the product's image, or the Unsplash fallback
    const img = document.createElement('img');
    img.src = coverProduct.image || 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&q=80';
    img.alt = category;
    card.appendChild(img);
    
    const overlay = document.createElement('div');
    overlay.className = 'coll-card-overlay';
    card.appendChild(overlay);
    
    const info = document.createElement('div');
    info.className = 'coll-card-info';
    // Style the text to look like a centered, bold category title
    info.innerHTML = `
      <div class="coll-card-name" style="font-size: 22px; text-align: center; width: 100%; letter-spacing: 0.1em;">
        ${category}
      </div>
    `;
    card.appendChild(info);
    
    collGrid.appendChild(card);
  });

  // ── ATTACH THE FILTER CLICKS ──
  // ── ATTACH THE FILTER CLICKS ──
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      // 1. Update the global state
      currentCategory = card.dataset.category;
      currentPage = 1; // Always reset to page 1 when changing categories!
      
      // 2. Re-render the shop with the new filters
      renderShop();
      
      // 3. Smooth scroll down to the shop section
      const shopSection = document.getElementById('shop');
      if (shopSection) {
        lenis.scrollTo(shopSection, { offset: -80, duration: 1.2 });
      }
    });
  });
}

// ── MASTER SHOP ENGINE (PAGINATION, SORTING, FILTERING) ──

// 1. Global State Variables
let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let currentCategory = "All Artworks";
let currentSort = "default";

function renderShop() {
  const shopGrid = document.getElementById('shopGrid');
  shopGrid.innerHTML = ''; // Clear the board

  // --- A. FILTERING ---
  let filtered = products.filter(p => p.available);
  if (currentCategory !== "All Artworks") {
    filtered = filtered.filter(p => p.tag === currentCategory);
  }

  // --- B. SORTING ---
  filtered.sort((a, b) => {
    if (currentSort === 'price-low') return a.price - b.price;
    if (currentSort === 'price-high') return b.price - a.price;
    if (currentSort === 'az') return a.name.localeCompare(b.name);
    if (currentSort === 'za') return b.name.localeCompare(a.name);
    return 0; 
  });

  // Update section count
  const countEl = document.getElementById('shopCount');
  if(countEl) {
    countEl.textContent = `${filtered.length} ${currentCategory === "All Artworks" ? "original artworks" : currentCategory}`;
  }

  // --- C. PAGINATION MATH ---
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages; // Failsafe

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  // --- D. RENDER CARDS ---
  paginatedProducts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.dataset.id = p.id;
    card.style.position = 'relative'; 
    
    const imgWrap = document.createElement('div');
    imgWrap.className = 'shop-card-img liquid-wrapper';
    imgWrap.id = `liquid-${p.id}`;
    card.appendChild(imgWrap);
    
    let priceHTML = `<div class="shop-card-price">₹${p.originalPrice.toLocaleString('en-IN')}</div>`;
    if (p.isOnSale) {
      priceHTML = `
        <div class="shop-card-price on-sale">
          <span class="original-slashed" style="text-decoration: line-through; opacity: 0.4; margin-right: 8px;">
            ₹${p.originalPrice.toLocaleString('en-IN')}
          </span>
          <span class="sale-active" style="font-weight: 700;">
            ₹${p.price.toLocaleString('en-IN')}
          </span>
        </div>
      `;
    }

    card.insertAdjacentHTML('beforeend', `
      ${p.isOnSale ? '<div class="sale-badge" style="position:absolute; top:12px; left:12px; z-index:5; font-size:9px; letter-spacing:0.1em; text-transform:uppercase; background:#080808; color:#f5f0eb; padding:4px 8px;">SALE</div>' : ''}
      <div class="shop-card-name">${p.name}</div>
      ${priceHTML}
      <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
    `);

    shopGrid.appendChild(card);

    // Init WebGL for this specific card
    new hoverEffect({
      parent: document.querySelector(`#liquid-${p.id}`),
      intensity: 0.3,
      image1: p.image || `https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&q=80`,
      image2: `https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&q=80`,
      displacementImage: 'assets/images/displacement-map.jpg'
    });

    // Product Page Open Logic
    card.addEventListener('click', (e) => {
      if(e.target.classList.contains('add-to-cart')) return;
      openProductPage(p.id);
    });
  });

  // Add GSAP stagger to smoothly pop the new cards in
  gsap.fromTo('.shop-card', 
    { opacity: 0, y: 20 }, 
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
  );

  // --- E. RENDER PAGINATION UI ---
  buildPaginationUI(totalPages);
  
  // Refresh scroll calculations
  setTimeout(() => ScrollTrigger.refresh(), 300);
}

// ── PAGINATION UI BUILDER ──
function buildPaginationUI(totalPages) {
  // Remove old pagination if it exists
  const oldPag = document.getElementById('shopPagination');
  if (oldPag) oldPag.remove();

  // If only 1 page, don't show controls
  if (totalPages <= 1) return;

  const pagContainer = document.createElement('div');
  pagContainer.id = 'shopPagination';
  pagContainer.className = 'shop-pagination';
  
  // Prev Button
  const prevBtn = document.createElement('button');
  prevBtn.innerText = '← Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { 
    currentPage--; 
    renderShop(); 
    lenis.scrollTo(document.getElementById('shopTrigger'), { offset: -50, duration: 0.8 }); 
  };
  pagContainer.appendChild(prevBtn);

  // Page Numbers
  const info = document.createElement('span');
  info.innerText = `${currentPage} / ${totalPages}`;
  pagContainer.appendChild(info);

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.innerText = 'Next →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => { 
    currentPage++; 
    renderShop(); 
    lenis.scrollTo(document.getElementById('shopTrigger'), { offset: -50, duration: 0.8 }); 
  };
  pagContainer.appendChild(nextBtn);

  // Add the controls directly under the shop grid
  document.getElementById('shop').appendChild(pagContainer);
}

// ── HOOK UP THE SORT DROPDOWN ──
const sortDropdown = document.getElementById('sortDropdown');
if (sortDropdown) {
  sortDropdown.addEventListener('change', (e) => {
    currentSort = e.target.value;
    currentPage = 1; // Reset to page 1 when sorting
    renderShop();
  });
}
// ── PRODUCT VIEW LOGIC ──
const productView = document.getElementById('productView');
const closeProductBtn = document.getElementById('closeProduct');

function openProductPage(id) {
  const product = products.find(p => p.id === id);

  document.getElementById('pvName').textContent = product.name;
  document.getElementById('pvPrice').textContent = `₹${product.price.toLocaleString('en-IN')}`;
  document.getElementById('pvTag').textContent = product.tag;
  document.getElementById('pvAddBtn').dataset.id = product.id;
  
  // Uses your sheet image, or a fallback if empty
  const pvImg = document.getElementById('pvImage');
  pvImg.src = product.image || `https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1000&q=80`;

  lenis.stop();

  const tl = gsap.timeline();
  tl.set(productView, { visibility: 'visible' })
    .to(productView, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut' })
    .to(pvImg, { opacity: 1, duration: 0.8, ease: 'power2.out' }, "-=0.6")
    .fromTo(['#pvTag', '#pvName', '#pvPrice', '.pv-desc', '#pvAddBtn'], 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 
      "-=0.6"
    );
}

if (closeProductBtn) {
  closeProductBtn.addEventListener('click', () => {
    const tl = gsap.timeline({
      onComplete: () => {
        lenis.start();
        document.getElementById('pvImage').style.opacity = '0';
      }
    });

    tl.to(productView, { clipPath: 'inset(100% 0 0 0)', duration: 1, ease: 'power4.inOut' })
      .set(productView, { visibility: 'hidden' }); 
  });
}

// Fire the database fetcher!
fetchProducts();



// ── CINEMATIC PRELOADER ──
const preloader = document.getElementById('preloader');
const progress = document.getElementById('preloaderProgress');
const countEl = document.getElementById('preloaderCount');
let count = 0;

const counter = setInterval(() => {
  count += Math.floor(Math.random() * 8) + 3;
  if (count >= 100) {
    count = 100;
    clearInterval(counter);
    progress.style.width = count + '%';
    countEl.textContent = count;

    // The Master Reveal Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        preloader.style.display = 'none';
        document.body.style.overflow = '';
        initAnimations();
      }
    });

    tl.to(['.preloader-line', '.preloader-count'], { opacity: 0, duration: 0.4, ease: 'power2.inOut' })
      // Massive text expansion like Indigo Lab
      .to('.preloader-logo', { scale: 12, opacity: 0, duration: 1.2, ease: 'power4.inOut' }, "+=0.2")
      // Slide the preloader up
      .to(preloader, { yPercent: -100, duration: 1.2, ease: 'power4.inOut' }, "-=1")
      // Animate the hero background dropping in
      .fromTo('.hero-video', { scale: 1.3, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 2, ease: 'power3.out' }, "-=1")
      .fromTo('.hero-canvas', { opacity: 0 }, { opacity: 1, duration: 2 }, "-=1.5");
      
  } else {
    progress.style.width = count + '%';
    countEl.textContent = count;
  }
}, 30);



document.body.style.overflow = 'hidden';

// ── LENIS SMOOTH SCROLL ──
const lenis = new Lenis({
  duration: 0.6,
  easing: (t) => t * (2 - t),
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 1.2,
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ── LENIS ANCHOR FIX ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();

    // Close contact modal if open
    const modal = document.getElementById('contactModal');
    if (modal && modal.style.visibility === 'visible') {
      gsap.to(modal, { 
        clipPath: 'inset(100% 0 0 0)', 
        duration: 0.8, 
        ease: 'power4.inOut',
        onComplete: () => {
          modal.style.visibility = 'hidden';
          lenis.start();
        }
      });
    }

    // Close cart if open
    closeCart();

    const targetId = a.getAttribute('href');
    if (targetId === '#') return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      setTimeout(() => {
        lenis.scrollTo(targetElement, { offset: -80, duration: 1.2 });
      }, 100);
    }
  });
});

window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 60);
});




// ── MAGNETIC BUTTONS ──
document.querySelectorAll('.magnetic').forEach(el => {
  // Skip close buttons — magnetic breaks their clicks
  if (el.id === 'cartClose' || el.id === 'closeContactBtn' || el.id === 'closeProduct') return;

  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
});



// ── MARQUEE ──
const words = ['Sacred geometry', 'Handcrafted', 'One of a kind', 'Original art', 'Made with intention', 'Lmandalas', 'Each piece unique'];
const track = document.getElementById('marqueeTrack');
if (track) {
  [...words, ...words, ...words].forEach((word) => {
    const s = document.createElement('span');
    s.textContent = word;
    track.appendChild(s);
    const dot = document.createElement('span');
    dot.textContent = ' · ';
    track.appendChild(dot);
  });
}

// ── PLACEHOLDER CANVAS (RESTORED) ──
function makePlaceholderCanvas(w, h, colors) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = '#0d0d0d';
  c.fillRect(0, 0, w, h);
  const rings = 6;
  for (let r = 0; r < rings; r++) {
    const rad = 35 + r * 32;
    const petals = 6 + r * 2;
    const alpha = 0.07 + (rings - r) * 0.04;
    for (let p = 0; p < petals; p++) {
      const ang = (p / petals) * Math.PI * 2;
      c.save();
      c.translate(w / 2, h / 2);
      c.rotate(ang);
      c.beginPath();
      c.ellipse(rad * 0.5, 0, rad * 0.3, rad * 0.07, 0, 0, Math.PI * 2);
      c.fillStyle = colors[0] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      c.fill();
      c.restore();
    }
    c.beginPath();
    c.arc(w / 2, h / 2, rad, 0, Math.PI * 2);
    c.strokeStyle = colors[1] + '20';
    c.lineWidth = 0.5;
    c.stroke();
  }
  c.beginPath();
  c.arc(w / 2, h / 2, 14, 0, Math.PI * 2);
  c.fillStyle = colors[0] + '55';
  c.fill();
  return cv;
}

// ── HOVER-PAN MOMENTUM SLIDER ──
const collectionsSection = document.querySelector('.collections-section');
const slider = document.getElementById('collectionsGrid');
let targetX = 0;
let currentX = 0;

if (collectionsSection && slider) {
  collectionsSection.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const screenW = window.innerWidth;
    
    // Only apply pan effect if the slider is wider than the screen
    if (slider.scrollWidth > screenW) {
      // Calculate max scroll distance (+ 96 to account for the 48px side paddings)
      const maxScroll = slider.scrollWidth - screenW + 96; 
      
      // Map mouse position to a percentage (0 to 1)
      const percentage = mouseX / screenW;
      
      // Calculate the target pixel to scroll to
      targetX = maxScroll * percentage;
    }
  });

  // Linear Interpolation (Lerp) for heavy, smooth physics
  // Linear Interpolation (Lerp) for heavy, smooth physics
  function animateSlider() {
    // If on mobile, clear the transform and KILL the loop completely
    if (window.innerWidth <= 768) {
      gsap.set(slider, { clearProps: "x" });
      return; // 💥 This stops requestAnimationFrame from firing again!
    }
    
    // Otherwise, run the desktop momentum physics
    currentX += (targetX - currentX) * 0.06; 
    gsap.set(slider, { x: -currentX });
    requestAnimationFrame(animateSlider);
  }
  
  // Start the loop
  animateSlider();
}



// Close Product Page
if (closeProductBtn) {
  closeProductBtn.addEventListener('click', () => {
    const tl = gsap.timeline({
      onComplete: () => {
        lenis.start();
        document.getElementById('pvImage').style.opacity = '0';
      }
    });

    // FIX: Slide it down, then instantly set it back to invisible
    tl.to(productView, { 
      clipPath: 'inset(100% 0 0 0)', 
      duration: 1, 
      ease: 'power4.inOut' 
    })
    .set(productView, { visibility: 'hidden' }); 
  });
}

// ── GSAP ANIMATIONS ──
function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.to('.hero-video', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });



  document.querySelectorAll('.split-text').forEach(el => {
    const text = el.innerHTML;
    const words = text.split(/(\s+)/);
    el.innerHTML = words.map(word => word.trim() ? `<span class="split-line-wrap"><span class="word">${word}</span></span>` : word).join('');

    gsap.fromTo(
      el.querySelectorAll('.word'),
      { yPercent: 100, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } }
    );
  });

  document.querySelectorAll('.section-title').forEach(el => {
    gsap.fromTo(el, { x: -30 }, { x: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top center', scrub: 1 } });
  });

  

  

  gsap.fromTo('.contact-title',
    { yPercent: 15, opacity: 0 },
    { yPercent: 0, opacity: 1, ease: 'power3.out', scrollTrigger: { trigger: '.contact-section', start: 'top 80%', end: 'top 40%', scrub: 1 } }
  );

  // ── FULL BLEED PARALLAX REVEAL ──
  const parallaxImg = document.querySelector('.parallax-img');
  if (parallaxImg) {
    gsap.fromTo(parallaxImg,
      { 
        yPercent: -15, // Starts slightly pulled up
        scale: 1.1     // Starts slightly zoomed in
      },
      { 
        yPercent: 15,  // Pushes down as you scroll
        scale: 1,      // Zooms out to normal size
        ease: "none",
        scrollTrigger: {
          trigger: ".parallax-divider",
          start: "top bottom", // Starts animating the second the top edge enters the bottom of the screen
          end: "bottom top",   // Ends when the bottom edge leaves the top of the screen
          scrub: true          // Ties it directly to the scroll wheel
        }
      }
    );
  }
  // ── EDITORIAL DUAL PARALLAX ──
  const imgUp = document.querySelector('.img-up');
  const imgDown = document.querySelector('.img-down');

  if (imgUp && imgDown) {
    // Left Image: Starts pulled down inside the frame, pushes UP as you scroll down
    gsap.fromTo(imgUp,
      { yPercent: 20, scale: 1.05 },
      { 
        yPercent: -20, 
        scale: 1,      
        ease: "none",
        scrollTrigger: {
          trigger: ".mask-left",
          start: "top bottom", 
          end: "bottom top",   
          scrub: true          
        }
      }
    );

    // Right Image: Starts pulled up inside the frame, pushes DOWN as you scroll down
    gsap.fromTo(imgDown,
      { yPercent: -20, scale: 1.05 },
      { 
        yPercent: 20, 
        scale: 1,      
        ease: "none",
        scrollTrigger: {
          trigger: ".mask-right",
          start: "top bottom", 
          end: "bottom top",   
          scrub: true          
        }
      }
    );
  }
// ── SHOP APERTURE REVEAL ──
  const shopTrigger = document.getElementById('shopTrigger');
  const shopSection = document.getElementById('shop');

  if (shopTrigger && shopSection) {
    gsap.to(shopSection, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)', 
      scale: 1, 
      ease: "none",
      scrollTrigger: {
        trigger: shopTrigger,
        start: "top 80%", 
        end: "top 20%",   
        scrub: 1 
      }
    });
  }

  
}

// ── CART LOGIC ──
function updateCartUI() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  document.getElementById('cartCount').textContent = count;
  const headerCount = document.getElementById('cartHeaderCount');
if (headerCount) headerCount.textContent = count === 0 ? '0 items' : `${count} item${count > 1 ? 's' : ''}`;
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.<br>Explore our collections.</p>';
    footerEl.innerHTML = '';
    return;
  }
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img" style="background:#e8e2d9;width:64px;height:64px;"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')} × ${item.qty}</div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">✕</button>
    </div>
  `).join('');
  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);
  footerEl.innerHTML = `
    <div class="cart-total">
      <span>Total</span>
      <span>₹${total.toLocaleString('en-IN')}</span>
    </div>
    <button class="checkout-btn" id="checkoutBtn">Proceed to Checkout</button>
  `;
  document.getElementById('checkoutBtn').addEventListener('click', initRazorpay);
  itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(i => i.id !== parseInt(btn.dataset.id));
      updateCartUI();
      syncCartToDB();
    });
  });
}

// ── BULLETPROOF CART LOGIC ──
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  // Removed the hacky navbar z-index and pointer-events logic!
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  // Removed the timeout and hacky navbar resets! 
}

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);
// cartClose is handled by inline onclick in HTML — do NOT add another listener here

document.addEventListener('click', e => {
  if (e.target.classList.contains('add-to-cart')) {
    const id = parseInt(e.target.dataset.id);
    const product = products.find(p => p.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });
    updateCartUI();
    syncCartToDB(); // NEW: Save to database!
    openCart();
  }
});

function initRazorpay() {
  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);
  const options = {
    key: 'YOUR_RAZORPAY_KEY_HERE',
    amount: total * 100,
    currency: 'INR',
    name: 'Lmandalas',
    description: 'Original Mandala Artwork',
    theme: { color: '#080808' },
    handler: function(response) {
      alert('Payment successful! Order ID: ' + response.razorpay_payment_id);
      cart = [];
      updateCartUI();
      closeCart();
    },
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

updateCartUI();
// ── INDIGO CONTACT MODAL ANIMATION ──
const openContactBtn = document.getElementById('openContactBtn');
const closeContactBtn = document.getElementById('closeContactBtn');
const contactModal = document.getElementById('contactModal');

if (openContactBtn && contactModal) {
  openContactBtn.addEventListener('click', () => {
    // Stop background scrolling
    lenis.stop();
    
    const tl = gsap.timeline();
    tl.set(contactModal, { visibility: 'visible' })
      .to(contactModal, { 
        clipPath: 'inset(0% 0 0 0)', 
        duration: 1.2, 
        ease: 'power4.inOut' 
      })
      // Stagger the text elements inside the left panel
      .fromTo(['.cm-title', '.cm-desc', '.cm-actions', '.cm-socials a'], 
  { y: 40, opacity: 0 }, 
  { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 
  "-=0.6"
)
.set('#closeContactBtn', { opacity: 1, visibility: 'visible' }, 0);
  });
}

if (closeContactBtn && contactModal) {
  closeContactBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const tl = gsap.timeline({
      onComplete: () => {
        lenis.start();
      }
    });
    tl.to(contactModal, { 
      clipPath: 'inset(100% 0 0 0)', 
      duration: 1, 
      ease: 'power4.inOut' 
    })
    .set(contactModal, { visibility: 'hidden' });
  });
}

// Optional: Close modal if they click the "Shop Online" button inside it
const cmShopBtn = document.getElementById('cmShopBtn');
if (cmShopBtn) {
  cmShopBtn.addEventListener('click', () => {
    closeContactBtn.click(); // Trigger the close animation
    setTimeout(() => {
      // Scroll to shop section after modal closes
      const shopTarget = document.getElementById('shop');
      if (shopTarget) lenis.scrollTo(shopTarget, { offset: -50, duration: 1.2 });
    }, 1000);
  });
}
// ── GOLIATH POSTER: LIQUID SHADER & SCROLLING LABEL ──

// CRITICAL: Force GSAP to recognize the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const initClothRipplePoster = () => {
  const imageSource = document.getElementById('posterSource');
  const canvasContainer = document.getElementById('interactivePoster');

  if (!imageSource || !canvasContainer || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  
  // Vertex Shader 
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment Shader 
  const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_rippleIntensity;

    void main() {
      vec2 uv = vUv;
      float dist = distance(uv, u_mouse);
      vec2 dir = uv - u_mouse;
      float wave = sin(dist * 40.0 - u_time * 6.0); 
      float dampening = smoothstep(0.4, 0.0, dist); 
      vec2 offset = dir * wave * dampening * u_rippleIntensity;
      gl_FragColor = texture2D(u_texture, uv + offset);
    }
  `;

  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous'); 
  const texture = textureLoader.load(imageSource.src);
  
  const geometry = new THREE.PlaneGeometry(1, 1, 32, 32); 
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_time: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) }, 
      u_texture: { value: texture },
      u_rippleIntensity: { value: 0.0 } 
    },
    transparent: true
  });

  const mesh = new THREE.Mesh(geometry, material); 
  scene.add(mesh);

  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
  camera.position.z = 1;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  canvasContainer.appendChild(renderer.domElement);

  // ── THE GPU KILL SWITCH (INTERSECTION OBSERVER) ──
  let isPosterVisible = false;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isPosterVisible = entry.isIntersecting;
    });
  }, { threshold: 0.0 });
  
  observer.observe(canvasContainer);

  // WE ONLY DECLARE THIS ONCE!
  const clock = new THREE.Clock();

  function animatePoster() {
    requestAnimationFrame(animatePoster);
    
    // ONLY render the heavy WebGL math if the user is actually looking at it!
    if (isPosterVisible) {
      material.uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    }
  }
  animatePoster();

  // Mouse Tracking
  canvasContainer.addEventListener('mousemove', (e) => {
    const rect = canvasContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height; // Invert Y for WebGL
    gsap.to(material.uniforms.u_mouse.value, { x: x, y: y, duration: 0.2 });
  });

  // Activate Liquid Ripple
  canvasContainer.addEventListener('mouseenter', () => {
    gsap.to(material.uniforms.u_rippleIntensity, { value: 0.15, duration: 0.6, ease: "power2.out" });
  });
  
  // Snap back to flat
  canvasContainer.addEventListener('mouseleave', () => {
    gsap.to(material.uniforms.u_rippleIntensity, { value: 0.0, duration: 1.2, ease: "elastic.out(1, 0.3)" });
    gsap.to(material.uniforms.u_mouse.value, { x: 0.5, y: 0.5, duration: 1 });
  });

  window.addEventListener('resize', () => {
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  });
};

// ── SCROLLING TEXT LOGIC (FIXED MATH) ──
const initPosterScrollingLabel = () => {
  const labelText = document.getElementById('posterLabel');
  if (!labelText) return;

  // Split text for staggered reveal
  const text = labelText.innerText;
  labelText.innerHTML = '';
  text.split('').forEach(char => {
    const span = document.createElement('span');
    span.innerText = char === ' ' ? '\u00A0' : char; 
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transform = 'translateY(10px)';
    labelText.appendChild(span);
  });

  // Fade in the characters
  gsap.to(labelText.querySelectorAll('span'), {
    opacity: 1,
    y: 0,
    stagger: 0.05,
    scrollTrigger: {
      trigger: ".poster-section",
      start: "top 80%",
      toggleActions: "play none none none"
    }
  });

  // The Drag Movement - Pushes it down 120vh so it stops at the bottom of the section
  gsap.to(labelText, {
    y: "120vh", 
    ease: "none", 
    scrollTrigger: {
      trigger: ".poster-section",
      start: "top top",      // Start exactly when the poster hits the top of the screen
      end: "bottom bottom",  // Finish exactly when the poster reaches the bottom of the screen
      scrub: 0.5             // 0.5 adds a tiny bit of smooth friction to the movement
    }
  });
};


// ── EDITORIAL ABOUT ANIMATION (TEXT TYPING ONLY) ──
const initEditorialAbout = () => {
  const aboutText = document.getElementById('aboutText');
  if (!aboutText || typeof gsap === 'undefined') return;

  // 1. Split text into individual spans for character reveal
  const text = aboutText.innerText;
  aboutText.innerHTML = '';
  text.split('').forEach(char => {
    const span = document.createElement('span');
    span.innerText = char === ' ' ? '\u00A0' : char;
    span.style.opacity = '0.15';
    aboutText.appendChild(span);
  });

  const chars = aboutText.querySelectorAll('span');

  // 2. Master Scroll Control Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-editorial",
      start: "top 70%", // Starts typing when the section is 30% into the screen
      end: "bottom 80%",   
      scrub: 1             
    }
  });

  // 3. Opaque text fading timeline
  tl.to(chars, {
    opacity: 1,
    stagger: 0.04,
    ease: "none"
  }, 0);
};
// Fire everything up safely
window.addEventListener('load', () => {
  if (typeof initClothRipplePoster === 'function') initClothRipplePoster();
  if (typeof initPosterScrollingLabel === 'function') initPosterScrollingLabel();
  
  // Add the new About section trigger here!
  if (typeof initEditorialAbout === 'function') initEditorialAbout();
  
  setTimeout(() => ScrollTrigger.refresh(), 500);
});
// ── LOGIN MODAL ANIMATION & UI TOGGLE ──
const openLoginBtn = document.getElementById('openLoginBtn');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginModal = document.getElementById('loginModal');

if (openLoginBtn && loginModal) {
  openLoginBtn.addEventListener('click', () => {
    lenis.stop();
    const tl = gsap.timeline();
    tl.set(loginModal, { visibility: 'visible' })
      .to(loginModal, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut' })
      .fromTo(
        loginModal.querySelectorAll('.cm-title, .cm-desc, .input-group, .cm-actions'), 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 
        "-=0.6"
      );
  });
}

if (closeLoginBtn && loginModal) {
  closeLoginBtn.addEventListener('click', () => {
    const tl = gsap.timeline({ onComplete: () => lenis.start() });
    tl.to(loginModal, { clipPath: 'inset(100% 0 0 0)', duration: 1, ease: 'power4.inOut' })
      .set(loginModal, { visibility: 'hidden' });
  });
}

// Toggle between Sign In and Sign Up visually
let isSignUp = false;
const toggleAuthMode = document.getElementById('toggleAuthMode');

if (toggleAuthMode) {
  toggleAuthMode.addEventListener('click', () => {
    isSignUp = !isSignUp;
    document.getElementById('authTitle').innerHTML = isSignUp ? 'JOIN<br>THE CIRCLE' : 'ACCESS<br>THE VAULT';
    document.getElementById('authDesc').innerText = isSignUp ? 'Create an account to secure your original artworks.' : 'Enter your credentials to access your vault.';
    document.getElementById('authSubmitBtn').innerText = isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN';
    document.getElementById('authToggleQuestion').innerText = isSignUp ? 'Already have an account?' : 'Don\'t have an account?';
    toggleAuthMode.innerText = isSignUp ? 'Sign In.' : 'Create one.';
  });
}

// ── MOBILE MENU GSAP LOGIC ──
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mmLinks = document.querySelectorAll('.mm-links a');

if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    lenis.stop(); // Pauses background scrolling
    const tl = gsap.timeline();
    tl.set(mobileMenu, { visibility: 'visible' })
      .to(mobileMenu, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power4.inOut' })
      .to(mmLinks, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, "-=0.4");
  });
}

if (closeMenuBtn) {
  closeMenuBtn.addEventListener('click', () => {
    const tl = gsap.timeline({ onComplete: () => lenis.start() });
    tl.to(mobileMenu, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'power4.inOut' })
      .set(mobileMenu, { visibility: 'hidden' })
      .set(mmLinks, { opacity: 0, y: 20 });
  });
}

// ── FIX: MOBILE MENU CLICK LOGIC ──
mmLinks.forEach(link => {
  link.addEventListener('click', () => {
    lenis.start(); // CRITICAL: Unfreeze the page immediately so scrolling works!
    closeMenuBtn.click(); // Trigger the close animation
  });
});

// Wire up the mobile Contact and Login buttons to trigger the desktop modals
const mobileContactBtn = document.getElementById('mobileContactBtn');
if (mobileContactBtn) {
  mobileContactBtn.addEventListener('click', () => {
    // Adds a tiny delay so the menu starts closing before the modal pops up
    setTimeout(() => document.getElementById('openContactBtn').click(), 200); 
  });
}

const mobileLoginBtn = document.getElementById('mobileLoginBtn');
if (mobileLoginBtn) {
  mobileLoginBtn.addEventListener('click', () => {
    setTimeout(() => document.getElementById('openLoginBtn').click(), 200);
  });
}