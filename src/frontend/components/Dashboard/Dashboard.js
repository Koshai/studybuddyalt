// components/Dashboard/Dashboard.js

window.DashboardComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
        <!-- Metrics Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricsCard
                title="Total Subjects"
                :value="store.state.statistics.totalSubjects"
                subtitle="Active subjects"
                icon="fas fa-book"
                color="primary"
                @click="store.setCurrentView('subjects')"
            />
            
            <MetricsCard
                title="Questions Answered"
                :value="store.state.statistics.totalAnswered"
                subtitle="Practice sessions"
                icon="fas fa-brain"
                color="secondary"
                @click="store.setCurrentView('practice')"
            />
            
            <MetricsCard
                title="Accuracy Rate"
                :value="store.accuracyPercentage + '%'"
                subtitle="Overall performance"
                icon="fas fa-target"
                color="accent"
            />
        </div>

        <!-- Quick Actions -->
        <div class="content-card p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    @click="store.showCreateSubjectModal()"
                    class="flex items-center space-x-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors text-left"
                >
                    <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                        <i class="fas fa-plus"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">New Subject</h4>
                        <p class="text-sm text-gray-600">Create a new study subject</p>
                    </div>
                </button>
                
                <button
                    @click="store.setCurrentView('upload')"
                    class="flex items-center space-x-3 p-4 bg-accent-50 hover:bg-accent-100 rounded-xl transition-colors text-left"
                >
                    <div class="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center text-white">
                        <i class="fas fa-upload"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">Upload Materials</h4>
                        <p class="text-sm text-gray-600">Add study documents</p>
                    </div>
                </button>
                
                <button
                    @click="startQuickPractice"
                    :disabled="!canStartPractice"
                    :class="[
                        'flex items-center space-x-3 p-4 rounded-xl transition-colors text-left',
                        canStartPractice 
                            ? 'bg-secondary-50 hover:bg-secondary-100' 
                            : 'bg-gray-50 cursor-not-allowed opacity-50'
                    ]"
                >
                    <div :class="[
                        'w-10 h-10 rounded-lg flex items-center justify-center text-white',
                        canStartPractice ? 'bg-secondary-500' : 'bg-gray-400'
                    ]">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">Quick Practice</h4>
                        <p class="text-sm text-gray-600">
                            {{ canStartPractice ? 'Start practicing now' : 'Add subjects first' }}
                        </p>
                    </div>
                </button>
            </div>
        </div>

        <!-- Recent Subjects -->
        <div class="content-card p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900">Recent Subjects</h3>
                <button
                    @click="store.setCurrentView('subjects')"
                    class="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                >
                    View all →
                </button>
            </div>
            
            <!-- Empty State -->
            <div v-if="store.state.subjects.length === 0" class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-book text-gray-400 text-2xl"></i>
                </div>
                <h4 class="text-lg font-medium text-gray-900 mb-2">No subjects yet</h4>
                <p class="text-gray-600 mb-4">Create your first subject to start learning</p>
                <button
                    @click="store.showCreateSubjectModal()"
                    class="btn-gradient text-white px-6 py-2 rounded-lg font-medium"
                >
                    Create Subject
                </button>
            </div>
            
            <!-- Subjects Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                    v-for="subject in recentSubjects"
                    :key="subject.id"
                    @click="store.selectSubject(subject)"
                    class="p-4 border border-gray-200 rounded-xl hover-lift cursor-pointer group"
                >
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-medium group-hover:shadow-lg transition-shadow">
                            {{ subject.name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-xs text-gray-500">
                            {{ formatDate(subject.created_at) }}
                        </span>
                    </div>
                    <h4 class="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {{ subject.name }}
                    </h4>
                    <p class="text-sm text-gray-600 line-clamp-2">
                        {{ subject.description || 'No description available' }}
                    </p>
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span class="text-xs text-gray-500">0 topics</span>
                        <div class="flex items-center space-x-1">
                            <div class="w-2 h-2 bg-accent-500 rounded-full"></div>
                            <span class="text-xs text-accent-600 font-medium">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Learning Progress (if we have data) -->
        <div v-if="store.state.score.total > 0" class="content-card p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">Overall Accuracy</span>
                    <span class="text-sm font-bold text-gray-900">{{ store.accuracyPercentage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                        class="bg-gradient-to-r from-accent-500 to-primary-500 h-3 rounded-full transition-all duration-500"
                        :style="{ width: store.accuracyPercentage + '%' }"
                    ></div>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="text-center p-3 bg-accent-50 rounded-lg">
                        <div class="text-xl font-bold text-accent-600">{{ store.state.score.correct }}</div>
                        <div class="text-xs text-accent-700">Correct Answers</div>
                    </div>
                    <div class="text-center p-3 bg-red-50 rounded-lg">
                        <div class="text-xl font-bold text-red-600">{{ store.state.score.total - store.state.score.correct }}</div>
                        <div class="text-xs text-red-700">Incorrect Answers</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;

        const recentSubjects = Vue.computed(() => {
            return store.state.subjects
                .slice()
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 6);
        });

        const canStartPractice = Vue.computed(() => {
            return store.state.subjects.length > 0;
        });

        const startQuickPractice = () => {
            if (canStartPractice.value) {
                store.setCurrentView('practice');
            }
        };

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        return {
            store,
            recentSubjects,
            canStartPractice,
            startQuickPractice,
            formatDate
        };
    }
};

// MetricsCard component
window.MetricsCard = {
    props: {
        title: String,
        value: [String, Number],
        subtitle: String,
        icon: String,
        color: {
            type: String,
            default: 'primary'
        }
    },
    
    template: `
    <div 
        class="metric-card rounded-2xl p-6 cursor-pointer hover-lift"
        @click="$emit('click')"
    >
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm font-medium text-gray-600">{{ title }}</p>
                <p class="text-3xl font-bold text-gray-900">{{ value }}</p>
                <p :class="subtitleClass" class="text-sm mt-1">{{ subtitle }}</p>
            </div>
            <div :class="iconWrapperClass" class="w-12 h-12 rounded-xl flex items-center justify-center">
                <i :class="icon + ' text-xl'" :class="iconClass"></i>
            </div>
        </div>
    </div>
    `,
    
    setup(props) {
        const colorClasses = {
            primary: {
                iconWrapper: 'bg-primary-100',
                icon: 'text-primary-600',
                subtitle: 'text-primary-600'
            },
            secondary: {
                iconWrapper: 'bg-secondary-100',
                icon: 'text-secondary-600',
                subtitle: 'text-secondary-600'
            },
            accent: {
                iconWrapper: 'bg-accent-100',
                icon: 'text-accent-600',
                subtitle: 'text-accent-600'
            }
        };
        
        const classes = colorClasses[props.color] || colorClasses.primary;
        
        return {
            iconWrapperClass: classes.iconWrapper,
            iconClass: classes.icon,
            subtitleClass: classes.subtitle
        };
    },
    
    emits: ['click']
};