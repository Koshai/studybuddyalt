// src/frontend/components/Loading/SkeletonLoader.js - Skeleton Loading Components
window.SkeletonLoader = {
    template: `
        <div :class="containerClasses">
            <!-- Card Skeleton -->
            <div v-if="type === 'card'" class="animate-pulse">
                <div class="bg-gray-200 rounded-lg h-4 w-3/4 mb-3"></div>
                <div class="bg-gray-200 rounded h-3 w-full mb-2"></div>
                <div class="bg-gray-200 rounded h-3 w-5/6 mb-2"></div>
                <div class="bg-gray-200 rounded h-3 w-4/6"></div>
            </div>

            <!-- List Item Skeleton -->
            <div v-else-if="type === 'list-item'" class="animate-pulse flex items-center space-x-3">
                <div class="bg-gray-200 rounded-full h-10 w-10"></div>
                <div class="flex-1">
                    <div class="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                    <div class="bg-gray-200 rounded h-3 w-1/2"></div>
                </div>
            </div>

            <!-- Text Block Skeleton -->
            <div v-else-if="type === 'text'" class="animate-pulse space-y-2">
                <div v-for="line in lines" :key="line" class="bg-gray-200 rounded h-3" :class="getLineWidth(line)"></div>
            </div>

            <!-- Table Row Skeleton -->
            <div v-else-if="type === 'table-row'" class="animate-pulse">
                <div class="grid grid-cols-4 gap-4">
                    <div class="bg-gray-200 rounded h-4"></div>
                    <div class="bg-gray-200 rounded h-4"></div>
                    <div class="bg-gray-200 rounded h-4"></div>
                    <div class="bg-gray-200 rounded h-4"></div>
                </div>
            </div>

            <!-- Profile Skeleton -->
            <div v-else-if="type === 'profile'" class="animate-pulse flex items-center space-x-4">
                <div class="bg-gray-200 rounded-full h-16 w-16"></div>
                <div class="flex-1">
                    <div class="bg-gray-200 rounded h-5 w-1/3 mb-2"></div>
                    <div class="bg-gray-200 rounded h-4 w-1/4 mb-1"></div>
                    <div class="bg-gray-200 rounded h-3 w-1/2"></div>
                </div>
            </div>

            <!-- Topic Card Skeleton -->
            <div v-else-if="type === 'topic'" class="animate-pulse">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="bg-gray-200 rounded-lg h-10 w-10"></div>
                    <div class="flex-1">
                        <div class="bg-gray-200 rounded h-4 w-2/3 mb-1"></div>
                        <div class="bg-gray-200 rounded h-3 w-1/3"></div>
                    </div>
                </div>
                <div class="bg-gray-200 rounded h-3 w-full mb-2"></div>
                <div class="bg-gray-200 rounded h-3 w-4/5"></div>
            </div>

            <!-- Question Card Skeleton -->
            <div v-else-if="type === 'question'" class="animate-pulse">
                <div class="bg-gray-200 rounded h-4 w-1/4 mb-3"></div>
                <div class="bg-gray-200 rounded h-5 w-full mb-4"></div>
                <div class="space-y-2">
                    <div class="bg-gray-200 rounded-lg h-10 w-full"></div>
                    <div class="bg-gray-200 rounded-lg h-10 w-full"></div>
                    <div class="bg-gray-200 rounded-lg h-10 w-full"></div>
                    <div class="bg-gray-200 rounded-lg h-10 w-full"></div>
                </div>
            </div>

            <!-- Dashboard Stats Skeleton -->
            <div v-else-if="type === 'stats'" class="animate-pulse">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div v-for="stat in 4" :key="stat" class="bg-white rounded-lg p-4 border border-gray-200">
                        <div class="flex items-center justify-between mb-2">
                            <div class="bg-gray-200 rounded h-4 w-1/2"></div>
                            <div class="bg-gray-200 rounded-full h-8 w-8"></div>
                        </div>
                        <div class="bg-gray-200 rounded h-6 w-1/3 mb-1"></div>
                        <div class="bg-gray-200 rounded h-3 w-2/3"></div>
                    </div>
                </div>
            </div>

            <!-- Form Input Skeleton -->
            <div v-else-if="type === 'form'" class="animate-pulse space-y-4">
                <div v-for="field in fields" :key="field">
                    <div class="bg-gray-200 rounded h-4 w-1/4 mb-2"></div>
                    <div class="bg-gray-200 rounded-lg h-12 w-full"></div>
                </div>
            </div>

            <!-- Upload Area Skeleton -->
            <div v-else-if="type === 'upload'" class="animate-pulse">
                <div class="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <div class="bg-gray-200 rounded-full h-16 w-16 mx-auto mb-4"></div>
                    <div class="bg-gray-200 rounded h-4 w-1/2 mx-auto mb-2"></div>
                    <div class="bg-gray-200 rounded h-3 w-1/3 mx-auto"></div>
                </div>
            </div>

            <!-- Default/Generic Skeleton -->
            <div v-else class="animate-pulse">
                <div class="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
                <div class="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
                <div class="bg-gray-200 rounded h-4 w-5/6"></div>
            </div>
        </div>
    `,

    props: {
        type: {
            type: String,
            default: 'default',
            validator: (value) => [
                'card', 'list-item', 'text', 'table-row', 'profile', 
                'topic', 'question', 'stats', 'form', 'upload', 'default'
            ].includes(value)
        },
        lines: {
            type: Number,
            default: 3
        },
        fields: {
            type: Number,
            default: 3
        },
        class: {
            type: String,
            default: ''
        }
    },

    setup(props) {
        const containerClasses = Vue.computed(() => {
            return props.class || '';
        });

        const getLineWidth = (lineNumber) => {
            const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3', 'w-1/2'];
            return widths[lineNumber % widths.length] || 'w-full';
        };

        return {
            containerClasses,
            getLineWidth
        };
    }
};

// Specialized skeleton components for common patterns
window.TopicCardSkeleton = {
    template: `
        <div class="bg-white rounded-lg border border-gray-200 p-4">
            <SkeletonLoader type="topic" />
        </div>
    `
};

window.QuestionCardSkeleton = {
    template: `
        <div class="bg-white rounded-lg border border-gray-200 p-6">
            <SkeletonLoader type="question" />
        </div>
    `
};

window.DashboardStatsSkeleton = {
    template: `
        <div class="mb-6">
            <SkeletonLoader type="stats" />
        </div>
    `
};

window.ListSkeleton = {
    template: `
        <div class="space-y-3">
            <div v-for="item in count" :key="item" class="bg-white rounded-lg border border-gray-200 p-4">
                <SkeletonLoader type="list-item" />
            </div>
        </div>
    `,
    
    props: {
        count: {
            type: Number,
            default: 5
        }
    }
};

window.FormSkeleton = {
    template: `
        <div class="bg-white rounded-lg border border-gray-200 p-6">
            <div class="animate-pulse space-y-4">
                <div class="bg-gray-200 rounded h-6 w-1/3 mb-6"></div>
                <SkeletonLoader type="form" :fields="fields" />
                <div class="pt-4">
                    <div class="bg-gray-200 rounded-lg h-12 w-full"></div>
                </div>
            </div>
        </div>
    `,
    
    props: {
        fields: {
            type: Number,
            default: 4
        }
    }
};

window.TableSkeleton = {
    template: `
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <!-- Table Header -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div class="animate-pulse">
                    <div class="grid grid-cols-4 gap-4">
                        <div class="bg-gray-200 rounded h-4"></div>
                        <div class="bg-gray-200 rounded h-4"></div>
                        <div class="bg-gray-200 rounded h-4"></div>
                        <div class="bg-gray-200 rounded h-4"></div>
                    </div>
                </div>
            </div>
            
            <!-- Table Rows -->
            <div class="divide-y divide-gray-200">
                <div v-for="row in rows" :key="row" class="px-6 py-4">
                    <SkeletonLoader type="table-row" />
                </div>
            </div>
        </div>
    `,
    
    props: {
        rows: {
            type: Number,
            default: 5
        }
    }
};

// Progress skeleton for loading states with percentage
window.ProgressSkeleton = {
    template: `
        <div class="animate-pulse">
            <div class="flex items-center justify-between mb-2">
                <div class="bg-gray-200 rounded h-4 w-1/3"></div>
                <div class="bg-gray-200 rounded h-4 w-12"></div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-200 h-2 rounded-full" :style="{ width: progress + '%' }"></div>
            </div>
        </div>
    `,
    
    props: {
        progress: {
            type: Number,
            default: 35
        }
    }
};

console.log('✅ SkeletonLoader components loaded successfully!');