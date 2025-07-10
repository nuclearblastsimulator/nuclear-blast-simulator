import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keywords to match cities and weapons to articles
const cityKeywords = {
  'hiroshima': ['hiroshima', 'hibakusha', 'little boy'],
  'nagasaki': ['nagasaki', 'hibakusha', 'fat man'],
  'oak-ridge': ['oak ridge', 'manhattan project', 'uranium enrichment'],
  'chicago': ['chicago', 'chicago pile', 'fermi', 'metallurgical laboratory'],
  'moscow': ['moscow', 'soviet', 'ussr', 'russia'],
  'beijing': ['beijing', 'china', 'chinese nuclear'],
  'washington': ['washington', 'pentagon', 'nuclear command'],
  'london': ['london', 'britain', 'uk nuclear'],
  'paris': ['paris', 'france', 'french nuclear'],
  'tehran': ['tehran', 'iran', 'iranian nuclear'],
  'los-angeles': ['los angeles', 'california'],
  'new-york': ['new york', 'manhattan'],
  'berlin': ['berlin', 'germany'],
  'tokyo': ['tokyo', 'japan'],
  'sydney': ['sydney', 'australia']
};

const weaponKeywords = {
  'little-boy': ['little boy', 'hiroshima', 'uranium', 'gun-type'],
  'fat-man': ['fat man', 'nagasaki', 'plutonium', 'implosion'],
  'castle-bravo': ['castle bravo', 'bikini', 'lithium'],
  'tsar-bomba': ['tsar bomba', 'novaya zemlya', 'sakharov', '50 megaton'],
  'ivy-mike': ['ivy mike', 'hydrogen bomb', 'fusion', 'enewetak'],
  'b83': ['b83', 'gravity bomb', 'strategic bomb'],
  'w87': ['w87', 'minuteman', 'icbm warhead'],
  'w88': ['w88', 'trident', 'slbm warhead'],
  'b61': ['b61', 'tactical', 'variable yield'],
  'minuteman': ['minuteman', 'icbm', 'land-based'],
  'trident': ['trident', 'slbm', 'submarine'],
  'polaris': ['polaris', 'submarine', 'slbm'],
  'df-5': ['df-5', 'chinese', 'icbm'],
  'df-41': ['df-41', 'chinese', 'icbm'],
  'agni': ['agni', 'india', 'missile'],
  'jericho': ['jericho', 'israel', 'missile'],
  'iskander': ['iskander', 'russia', 'tactical'],
  'topol': ['topol', 'russia', 'icbm'],
  'yars': ['yars', 'russia', 'icbm'],
  'sarmat': ['sarmat', 'russia', 'satan'],
  'bulava': ['bulava', 'russia', 'slbm'],
  'm51': ['m51', 'france', 'slbm'],
  'moab': ['moab', 'massive ordnance air blast', 'mother of all bombs', 'gbu-43'],
  'mop': ['mop', 'massive ordnance penetrator', 'gbu-57', 'bunker buster']
};

async function findArticles(directory) {
  const articles = [];
  
  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const relativePath = path.relative(path.join(__dirname, '../src/content'), fullPath);
        const urlPath = '/' + relativePath.replace(/\.md$/, '/').replace(/\\/g, '/');
        
        articles.push({
          path: urlPath,
          content: content.toLowerCase(),
          filename: entry.name.toLowerCase()
        });
      }
    }
  }
  
  await scanDir(directory);
  return articles;
}

function matchArticle(item, keywords, articles) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const article of articles) {
    let score = 0;
    
    // Check if article filename contains item id
    if (article.filename.includes(item.replace(/-/g, ' '))) {
      score += 10;
    }
    
    // Check keywords in content
    for (const keyword of keywords) {
      if (article.content.includes(keyword.toLowerCase())) {
        score += 5;
      }
      // Bonus for title/heading matches
      if (article.content.includes(`# ${keyword.toLowerCase()}`)) {
        score += 10;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = article.path;
    }
  }
  
  return bestScore > 10 ? bestMatch : null;
}

async function updateArticleLinks() {
  try {
    console.log('🔍 Scanning for articles...');
    
    // Find all articles
    const historyArticles = await findArticles(path.join(__dirname, '../src/content/history'));
    const termsArticles = await findArticles(path.join(__dirname, '../src/content/terms'));
    const allArticles = [...historyArticles, ...termsArticles];
    
    console.log(`📚 Found ${allArticles.length} articles`);
    
    // Load current data.json to get all cities and weapons
    const dataPath = path.join(__dirname, '../public/assets/data.json');
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    // Generate city links
    const cityArticleLinks = {};
    for (const location of data.locations) {
      const keywords = cityKeywords[location.id] || [location.name.toLowerCase()];
      cityArticleLinks[location.id] = matchArticle(location.id, keywords, allArticles);
    }
    
    // Generate weapon links
    const weaponArticleLinks = {};
    for (const weapon of data.weapons) {
      const keywords = weaponKeywords[weapon.id] || [weapon.name.toLowerCase()];
      weaponArticleLinks[weapon.id] = matchArticle(weapon.id, keywords, allArticles);
    }
    
    // Special cases and manual overrides
    // These are high-confidence matches based on article content
    const manualOverrides = {
      cities: {
        'hiroshima': '/history/medical-environmental/hibakusha/',
        'nagasaki': '/history/medical-environmental/hibakusha/',
        'chicago': '/history/historical-events/chicago-pile-1/'
      },
      weapons: {
        'little-boy': '/history/weapons-technology/fission-weapons/',
        'fat-man': '/history/weapons-technology/fission-weapons/',
        'castle-bravo': '/history/medical-environmental/castle-bravo/',
        'tsar-bomba': '/history/testing-sites/novaya-zemlya/',
        'ivy-mike': '/history/weapons-technology/fusion-weapons/',
        'polaris-a3': '/history/delivery-systems/nuclear-submarines/',
        'trident-ii-d5': '/terms/weapons-delivery-systems/nuclear-triad/',
        'minuteman-iii': '/terms/weapons-delivery-systems/icbm/',
        'iskander': '/terms/weapons-delivery-systems/tactical-nuclear-weapons/',
        'b61-12': '/terms/weapons-delivery-systems/tactical-nuclear-weapons/',
        'moab': '/history/weapons-technology/moab/',
        'mop': '/history/weapons-technology/gbu-57-mop/'
      }
    };
    
    // Apply manual overrides
    Object.assign(cityArticleLinks, manualOverrides.cities);
    Object.assign(weaponArticleLinks, manualOverrides.weapons);
    
    // Generate tooltip texts
    const cityTooltips = {
      'hiroshima': 'Learn about atomic bomb survivors',
      'nagasaki': 'Learn about atomic bomb survivors',
      'chicago': 'Read about the first nuclear reactor',
      'oak-ridge': 'Explore neutron discovery history',
      'moscow': 'Nuclear arms control treaties',
      'beijing': 'Chinese nuclear testing program',
      'tehran': 'Nuclear proliferation in the 21st century',
      'paris': 'French nuclear submarine program',
      'tokyo': 'Fukushima nuclear disaster',
      'new-york': 'Manhattan Project connections',
      'london': 'British nuclear program',
      'los-angeles': 'Nuclear research facilities',
      'berlin': 'Cold War nuclear tensions',
      'sydney': 'Nuclear-free zone movements'
    };
    
    const weaponTooltips = {
      // Conventional
      'tnt': 'Reference explosive baseline',
      'tomahawk': 'Cruise missile capabilities',
      'moab': 'Largest conventional explosive',
      
      // Historical
      'little-boy': 'Learn about fission weapon design',
      'fat-man': 'Learn about implosion-type weapons',
      'castle-bravo': 'Read about the test gone wrong',
      'tsar-bomba': 'Explore the largest bomb ever tested',
      'ivy-mike': 'Discover the first hydrogen bomb',
      'mop': 'Modern bunker buster technology',
      
      // International
      'aman': 'Pakistani nuclear program',
      'ghauri': 'Pakistani missile technology',
      'df-5': 'Chinese ICBM capabilities',
      
      // Tactical
      'iskander': 'Russian tactical nuclear systems',
      'b61-12': 'Modern tactical nuclear weapons',
      'w76-1': 'Submarine-launched warheads',
      'polaris-a3': 'Early submarine missiles',
      
      // Strategic
      'w87': 'Minuteman III warhead technology',
      'w78': 'ICBM warhead systems',
      'w88': 'Trident II warhead design',
      'b83': 'Strategic bomber deployments',
      'b61-13': 'Variable yield weapons',
      'b61-11': 'Earth penetrating weapons',
      
      // Delivery Systems
      'trident-ii-d5': 'Nuclear submarine capabilities',
      'minuteman-iii': 'Land-based ICBM systems',
      'kinzhal': 'Hypersonic missile technology',
      'ss-18-satan': 'Heavy ICBM systems',
      'poseidon': 'Nuclear-powered torpedoes',
      'burevestnik': 'Nuclear-powered cruise missiles',
      
      // Other
      'an-602-original': 'Original 100 megaton design',
      'chernobyl-equivalent': 'Nuclear accident comparison'
    };
    
    // Generate the output file
    const outputPath = path.join(__dirname, '../src/data/article-links.js');
    const output = `// Auto-generated by update-article-links.js
// Run 'npm run update-links' to regenerate

// Mapping of cities to related articles
export const cityArticleLinks = ${JSON.stringify(cityArticleLinks, null, 2)};

// Mapping of weapons to related articles
export const weaponArticleLinks = ${JSON.stringify(weaponArticleLinks, null, 2)};

// Tooltip text for cities
export const cityTooltips = ${JSON.stringify(cityTooltips, null, 2)};

// Tooltip text for weapons
export const weaponTooltips = ${JSON.stringify(weaponTooltips, null, 2)};

// Related articles for specific topics
export const relatedArticles = {
  'hiroshima': [
    '/history/key-figures/oppenheimer/',
    '/terms/nuclear-physics/fission/',
    '/terms/nuclear-technology/enrichment/'
  ],
  'nagasaki': [
    '/history/key-figures/oppenheimer/',
    '/terms/nuclear-physics/plutonium/',
    '/terms/nuclear-physics/fission/'
  ],
  'tsar-bomba': [
    '/history/key-figures/andrei-sakharov/',
    '/history/weapons-technology/fusion-weapons/',
    '/terms/nuclear-effects/megaton/'
  ],
  'castle-bravo': [
    '/history/testing-sites/bikini-atoll/',
    '/history/weapons-technology/fusion-weapons/',
    '/history/weapons-technology/nuclear-testing/'
  ]
};

// Statistics
export const linkStats = {
  totalCities: ${data.locations.length},
  linkedCities: ${Object.values(cityArticleLinks).filter(v => v !== null).length},
  totalWeapons: ${data.weapons.length},
  linkedWeapons: ${Object.values(weaponArticleLinks).filter(v => v !== null).length},
  lastUpdated: '${new Date().toISOString()}'
};
`;
    
    await fs.writeFile(outputPath, output);
    
    // Print statistics
    console.log('\n✅ Article links updated successfully!');
    console.log(`📊 Statistics:`);
    console.log(`   Cities: ${Object.values(cityArticleLinks).filter(v => v !== null).length}/${data.locations.length} linked`);
    console.log(`   Weapons: ${Object.values(weaponArticleLinks).filter(v => v !== null).length}/${data.weapons.length} linked`);
    
    // Show what's not linked
    const unlinkedCities = data.locations.filter(loc => !cityArticleLinks[loc.id]).map(loc => loc.name);
    const unlinkedWeapons = data.weapons.filter(w => !weaponArticleLinks[w.id]).map(w => w.name);
    
    if (unlinkedCities.length > 0) {
      console.log(`\n🏙️  Unlinked cities: ${unlinkedCities.join(', ')}`);
    }
    if (unlinkedWeapons.length > 0) {
      console.log(`\n💣 Unlinked weapons: ${unlinkedWeapons.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating article links:', error);
    process.exit(1);
  }
}

// Run the update
updateArticleLinks();