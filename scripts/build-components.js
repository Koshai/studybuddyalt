// scripts/build-components.js - Component Builder and Validator

const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

class ComponentBuilder {
    constructor() {
        this.sourceDir = path.join(__dirname, '../src/frontend');
        this.buildDir = path.join(__dirname, '../dist/frontend');
        this.componentsDir = path.join(this.sourceDir, 'components');
        this.errors = [];
        this.warnings = [];
    }

    async build() {
        console.log('🔨 Building modular components...');
        
        try {
            // Ensure build directory exists
            await fs.ensureDir(this.buildDir);
            
            // Copy and process files
            await this.copyStaticFiles();
            await this.buildComponents();
            await this.buildCoreFiles();
            await this.generateManifest();
            
            this.reportResults();
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    async copyStaticFiles() {
        console.log('📁 Copying static files...');
        
        // Copy index.html
        const indexSource = path.join(this.sourceDir, 'index.html');
        const indexDest = path.join(this.buildDir, 'index.html');
        await fs.copy(indexSource, indexDest);
        
        // Copy CSS files
        const cssDir = path.join(this.sourceDir, 'css');
        if (await fs.pathExists(cssDir)) {
            await fs.copy(cssDir, path.join(this.buildDir, 'css'));
        }
        
        // Copy assets
        const assetsDir = path.join(this.sourceDir, 'assets');
        if (await fs.pathExists(assetsDir)) {
            await fs.copy(assetsDir, path.join(this.buildDir, 'assets'));
        }
    }

    async buildComponents() {
        console.log('⚙️ Building components...');
        
        const componentDirs = [
            'Layout',
            'Dashboard', 
            'Subjects',
            'Upload',
            'Practice',
            'Modals'
        ];
        
        for (const dir of componentDirs) {
            const componentPath = path.join(this.componentsDir, dir);
            if (await fs.pathExists(componentPath)) {
                await this.processComponentDirectory(dir, componentPath);
            }
        }
    }

    async processComponentDirectory(dirName, dirPath) {
        const files = await fs.readdir(dirPath);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        const outputDir = path.join(this.buildDir, 'components', dirName);
        await fs.ensureDir(outputDir);
        
        for (const file of jsFiles) {
            const sourceFile = path.join(dirPath, file);
            const outputFile = path.join(outputDir, file);
            
            try {
                await this.processComponent(sourceFile, outputFile);
            } catch (error) {
                this.errors.push(`Failed to process ${file}: ${error.message}`);
            }
        }
    }

    async processComponent(sourcePath, outputPath) {
        let content = await fs.readFile(sourcePath, 'utf8');
        
        // Validate component structure
        this.validateComponent(sourcePath, content);
        
        // Minify in production
        if (process.env.NODE_ENV === 'production') {
            try {
                const result = await minify(content, {
                    compress: true,
                    mangle: false // Keep function names for debugging
                });
                content = result.code;
            } catch (error) {
                this.warnings.push(`Failed to minify ${path.basename(sourcePath)}: ${error.message}`);
            }
        }
        
        await fs.writeFile(outputPath, content);
    }

    validateComponent(filePath, content) {
        const fileName = path.basename(filePath);
        
        // Check for required patterns
        if (!content.includes('window.') && !content.includes('Component')) {
            this.warnings.push(`${fileName}: Component not properly exported to window object`);
        }
        
        if (!content.includes('template:')) {
            this.errors.push(`${fileName}: Missing template property`);
        }
        
        if (!content.includes('setup()')) {
            this.warnings.push(`${fileName}: Using Options API instead of Composition API`);
        }
        
        // Check for common issues
        if (content.includes('v-for') && !content.includes(':key')) {
            this.warnings.push(`${fileName}: v-for without :key detected`);
        }
        
        if (content.includes('innerHTML')) {
            this.warnings.push(`${fileName}: Direct innerHTML usage detected - consider v-html`);
        }
    }

    async buildCoreFiles() {
        console.log('🏗️ Building core files...');
        
        const coreFiles = [
            'js/api.js',
            'js/store.js', 
            'js/main.js',
            'js/utils.js'
        ];
        
        for (const file of coreFiles) {
            const sourcePath = path.join(this.sourceDir, file);
            const outputPath = path.join(this.buildDir, file);
            
            if (await fs.pathExists(sourcePath)) {
                await fs.ensureDir(path.dirname(outputPath));
                await this.processComponent(sourcePath, outputPath);
            }
        }
    }

    async generateManifest() {
        console.log('📋 Generating component manifest...');
        
        const manifest = {
            version: '1.0.0',
            buildTime: new Date().toISOString(),
            components: await this.scanComponents(),
            dependencies: this.getExternalDependencies(),
            loadOrder: this.getLoadOrder()
        };
        
        const manifestPath = path.join(this.buildDir, 'manifest.json');
        await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }

    async scanComponents() {
        const components = {};
        const componentDirs = await fs.readdir(this.componentsDir);
        
        for (const dir of componentDirs) {
            const dirPath = path.join(this.componentsDir, dir);
            const stat = await fs.stat(dirPath);
            
            if (stat.isDirectory()) {
                const files = await fs.readdir(dirPath);
                const jsFiles = files.filter(file => file.endsWith('.js'));
                
                components[dir] = [];
                for (const file of jsFiles) {
                    const stat = await fs.stat(path.join(dirPath, file));
                    components[dir].push({
                        name: file.replace('.js', ''),
                        path: `components/${dir}/${file}`,
                        size: stat.size
                    });
                }
            }
        }
        
        return components;
    }

    getExternalDependencies() {
        return [
            {
                name: 'Vue 3',
                url: 'https://unpkg.com/vue@3/dist/vue.global.js',
                local: './assets/js/vue.global.js'
            },
            {
                name: 'Tailwind CSS',
                url: 'https://cdn.tailwindcss.com',
                local: './assets/css/tailwind.min.css'
            },
            {
                name: 'Font Awesome',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
                local: './assets/css/fontawesome.min.css'
            },
            {
                name: 'Inter Font',
                url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
                local: './assets/fonts/inter.css'
            }
        ];
    }

    getLoadOrder() {
        return [
            // Core files first
            'js/api.js',
            'js/store.js', 
            'js/utils.js',
            
            // Layout components
            'components/Layout/Sidebar.js',
            'components/Layout/Header.js',
            'components/Layout/Notifications.js',
            
            // Feature components
            'components/Dashboard/Dashboard.js',
            'components/Dashboard/MetricsCard.js',
            'components/Subjects/SubjectsList.js',
            'components/Subjects/SubjectCard.js',
            'components/Subjects/TopicsList.js',
            'components/Subjects/TopicCard.js',
            'components/Upload/UploadForm.js',
            'components/Upload/FileDropzone.js',
            'components/Practice/PracticeSetup.js',
            'components/Practice/QuestionCard.js',
            'components/Modals/ModalBase.js',
            'components/Modals/CreateSubject.js',
            'components/Modals/CreateTopic.js',
            
            // Main app last
            'js/main.js'
        ];
    }

    reportResults() {
        console.log('\n📊 Build Results:');
        console.log('================');
        
        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }
        
        if (this.errors.length === 0) {
            console.log('\n✅ Build completed successfully!');
            console.log(`📁 Output: ${this.buildDir}`);
        } else {
            console.log(`\n❌ Build completed with ${this.errors.length} errors`);
            process.exit(1);
        }
    }

    // Development server with hot reload
    async startDevServer() {
        console.log('🚀 Starting development server...');
        
        const chokidar = require('chokidar');
        const express = require('express');
        const path = require('path');
        
        const app = express();
        app.use(express.static(this.sourceDir));
        
        // Watch for changes
        const watcher = chokidar.watch(this.sourceDir, {
            ignored: /node_modules/,
            persistent: true
        });
        
        watcher.on('change', async (filePath) => {
            console.log(`📝 File changed: ${filePath}`);
            if (filePath.endsWith('.js')) {
                await this.build();
                console.log('🔄 Build updated');
            }
        });
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`📡 Dev server running at http://localhost:${PORT}`);
        });
    }
}

// Utility functions for component development
class ComponentUtils {
    static generateComponentTemplate(name, type = 'basic') {
        const templates = {
            basic: `
// components/${name}.js

window.${name}Component = {
    template: \`
    <div class="component-${name.toLowerCase()}">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
    </div>
    \`,

    props: {
        title: {
            type: String,
            default: '${name} Component'
        },
        description: {
            type: String,
            default: 'Component description'
        }
    },

    setup(props) {
        const store = window.store;

        return {
            store
        };
    }
};`,
            
            modal: `
// components/Modals/${name}.js

window.${name}Modal = {
    template: \`
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 w-full max-w-md animate-scale-in">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-gray-900">{{ title }}</h3>
                <button @click="close" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="modal-content">
                <slot></slot>
            </div>
            
            <div class="flex space-x-3 pt-4">
                <button @click="confirm" class="flex-1 btn-gradient text-white py-3 rounded-lg font-medium">
                    {{ confirmText }}
                </button>
                <button @click="close" class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200">
                    Cancel
                </button>
            </div>
        </div>
    </div>
    \`,

    props: {
        title: String,
        confirmText: {
            type: String,
            default: 'Confirm'
        }
    },

    setup(props, { emit }) {
        const close = () => emit('close');
        const confirm = () => emit('confirm');

        return {
            close,
            confirm
        };
    },

    emits: ['close', 'confirm']
};`,
            
            form: `
// components/Forms/${name}.js

window.${name}Form = {
    template: \`
    <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-for="field in fields" :key="field.name" class="form-field">
            <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ field.label }}
            </label>
            <input
                v-model="formData[field.name]"
                :type="field.type"
                :placeholder="field.placeholder"
                :required="field.required"
                class="form-input w-full px-4 py-3 rounded-lg focus:outline-none"
            />
        </div>
        
        <button
            type="submit"
            :disabled="!isValid"
            class="w-full btn-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
            {{ submitText }}
        </button>
    </form>
    \`,

    props: {
        fields: Array,
        submitText: {
            type: String,
            default: 'Submit'
        }
    },

    setup(props, { emit }) {
        const formData = Vue.reactive({});
        
        // Initialize form data
        props.fields.forEach(field => {
            formData[field.name] = field.default || '';
        });

        const isValid = Vue.computed(() => {
            return props.fields.every(field => {
                return !field.required || formData[field.name];
            });
        });

        const handleSubmit = () => {
            if (isValid.value) {
                emit('submit', formData);
            }
        };

        return {
            formData,
            isValid,
            handleSubmit
        };
    },

    emits: ['submit']
};`
        };
        
        return templates[type] || templates.basic;
    }

    static async createComponent(name, type = 'basic', directory = 'components') {
        const fs = require('fs-extra');
        const path = require('path');
        
        const componentDir = path.join(__dirname, '../src/frontend', directory);
        await fs.ensureDir(componentDir);
        
        const componentPath = path.join(componentDir, `${name}.js`);
        const template = this.generateComponentTemplate(name, type);
        
        await fs.writeFile(componentPath, template);
        console.log(`✅ Created component: ${componentPath}`);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const builder = new ComponentBuilder();
    
    switch (command) {
        case 'build':
            builder.build();
            break;
            
        case 'dev':
            builder.startDevServer();
            break;
            
        case 'create':
            const name = args[1];
            const type = args[2] || 'basic';
            if (name) {
                ComponentUtils.createComponent(name, type);
            } else {
                console.log('Usage: node build-components.js create <ComponentName> [type]');
            }
            break;
            
        case 'validate':
            // Just run validation without building
            builder.validateAllComponents();
            break;
            
        default:
            console.log('Available commands:');
            console.log('  build    - Build all components');
            console.log('  dev      - Start development server');
            console.log('  create   - Create new component');
            console.log('  validate - Validate component structure');
    }
}

module.exports = { ComponentBuilder, ComponentUtils };