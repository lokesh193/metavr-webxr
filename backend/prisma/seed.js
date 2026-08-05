"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Clean existing
    await prisma.comment.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.favorite.deleteMany({});
    await prisma.file.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    // Password hash
    const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
    // Users
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@vrplatform.dev',
            name: 'VR Platform Admin',
            password: hashedPassword,
            role: 'ADMIN',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        },
    });
    const demoUser = await prisma.user.create({
        data: {
            email: 'user@vrplatform.dev',
            name: 'WebXR Creator',
            password: hashedPassword,
            role: 'USER',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        },
    });
    // Projects
    const project1 = await prisma.project.create({
        data: {
            title: 'Cyberpunk VR City Platform',
            description: 'Futuristic sci-fi VR environment optimized for WebXR 6DOF headsets with metallic shaders and dynamic ambient lighting.',
            userId: demoUser.id,
            type: 'MODEL',
            status: 'READY',
            glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            views: 1420,
            likesCount: 189,
        },
    });
    const project2 = await prisma.project.create({
        data: {
            title: 'Meta Horizon Sci-Fi Station',
            description: 'Interactive space module with teleportation waypoints, custom PBR material textures, and low draw-call batching.',
            userId: adminUser.id,
            type: 'MODEL',
            status: 'READY',
            glbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
            thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
            views: 950,
            likesCount: 112,
        },
    });
    const project3 = await prisma.project.create({
        data: {
            title: 'Unity WebGL VR Space Flight Simulator',
            description: 'Complete Unity Cloud Build exported for WebGL with 60+ FPS performance, WASM acceleration, and WebXR controller inputs.',
            userId: demoUser.id,
            type: 'UNITY',
            status: 'READY',
            unityUrls: JSON.stringify({
                loader: '/samples/unity/Build.loader.js',
                framework: '/samples/unity/Build.framework.js',
                data: '/samples/unity/Build.data',
                wasm: '/samples/unity/Build.wasm',
            }),
            thumbnail: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=800&q=80',
            views: 2310,
            likesCount: 420,
        },
    });
    // Comments
    await prisma.comment.create({
        data: {
            content: 'The WebXR lighting and performance on Meta Quest 3 is rock solid 90 FPS!',
            userId: adminUser.id,
            projectId: project1.id,
        },
    });
    await prisma.comment.create({
        data: {
            content: 'Loving the teleport mechanics and instant WebXR launching!',
            userId: demoUser.id,
            projectId: project1.id,
        },
    });
    console.log('✅ Database successfully seeded!');
}
main()
    .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
