import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'laura@tuenti.com',
                password: hashedPassword,
                name: 'Laura García',
                avatar: 'https://i.pravatar.cc/200?u=laura',
                bio: 'Mañana empiezo 21 días sin Tuenti, primera entrada en el blog...',
                gender: 'Mujer',
                age: 22,
                location: 'Madrid, España',
                occupation: 'Estudiante en URJC'
            }
        }),
        prisma.user.create({
            data: {
                email: 'fran@tuenti.com',
                password: hashedPassword,
                name: 'Francisco José',
                avatar: 'https://i.pravatar.cc/200?u=fran',
                bio: 'En el centro',
                gender: 'Hombre',
                age: 23,
                location: 'Madrid, España',
                occupation: 'Estudiante'
            }
        }),
        prisma.user.create({
            data: {
                email: 'maria@tuenti.com',
                password: hashedPassword,
                name: 'María López',
                avatar: 'https://i.pravatar.cc/200?u=maria',
                bio: 'Estudiando :(',
                gender: 'Mujer',
                age: 21,
                location: 'Barcelona, España',
                occupation: 'Estudiante'
            }
        }),
        prisma.user.create({
            data: {
                email: 'alberto@tuenti.com',
                password: hashedPassword,
                name: 'Alberto Ruiz',
                avatar: 'https://i.pravatar.cc/200?u=alberto',
                bio: 'Finde genial!!',
                gender: 'Hombre',
                age: 24,
                location: 'Valencia, España',
                occupation: 'Desarrollador'
            }
        }),
        prisma.user.create({
            data: {
                email: 'cristina@tuenti.com',
                password: hashedPassword,
                name: 'Cristina M.',
                avatar: 'https://i.pravatar.cc/200?u=cris',
                bio: 'Aburrida en casa',
                gender: 'Mujer',
                age: 22,
                location: 'Madrid, España',
                occupation: 'Diseñadora'
            }
        })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create friendships
    const friendships = await Promise.all([
        // Laura (0) is friends with everyone
        prisma.friendship.create({
            data: { userId: users[0].id, friendId: users[1].id, status: 'accepted' }
        }),
        prisma.friendship.create({
            data: { userId: users[0].id, friendId: users[2].id, status: 'accepted' }
        }),
        prisma.friendship.create({
            data: { userId: users[0].id, friendId: users[3].id, status: 'accepted' }
        }),
        prisma.friendship.create({
            data: { userId: users[0].id, friendId: users[4].id, status: 'accepted' }
        }),
        // Some pending requests
        prisma.friendship.create({
            data: { userId: users[1].id, friendId: users[2].id, status: 'pending' }
        })
    ]);

    console.log(`✅ Created ${friendships.length} friendships`);

    // Create posts
    const posts = await Promise.all([
        prisma.post.create({
            data: {
                userId: users[1].id,
                content: 'ha subido 8 fotos etiquetadas en "Fiesta fin de curso"',
                type: 'photo',
                image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80'
            }
        }),
        prisma.post.create({
            data: {
                userId: users[2].id,
                content: 'Jajaja no te lo crees ni tú que aguantes 21 días!',
                type: 'comment'
            }
        }),
        prisma.post.create({
            data: {
                userId: users[3].id,
                content: 'Buscando plan para el sábado noche, alguien se apunta?',
                type: 'status'
            }
        }),
        prisma.post.create({
            data: {
                userId: users[4].id,
                content: 'ha subido 3 fotos nuevas',
                type: 'photo',
                image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80'
            }
        }),
        prisma.post.create({
            data: {
                userId: users[0].id,
                content: '¡Qué buen fin de semana! Ya con ganas de que llegue el siguiente 🎉',
                type: 'status'
            }
        })
    ]);

    console.log(`✅ Created ${posts.length} posts`);

    // Create comments
    const comments = await Promise.all([
        prisma.comment.create({
            data: {
                postId: posts[0].id,
                userId: users[0].id,
                content: '¡Qué guay las fotos! Me lo pasé genial'
            }
        }),
        prisma.comment.create({
            data: {
                postId: posts[0].id,
                userId: users[2].id,
                content: 'Tenemos que repetir pronto!!'
            }
        }),
        prisma.comment.create({
            data: {
                postId: posts[2].id,
                userId: users[0].id,
                content: 'Yo me apunto! Dónde quedamos?'
            }
        }),
        prisma.comment.create({
            data: {
                postId: posts[2].id,
                userId: users[1].id,
                content: 'Yo también voy!'
            }
        })
    ]);

    console.log(`✅ Created ${comments.length} comments`);

    // Create messages
    const messages = await Promise.all([
        prisma.message.create({
            data: {
                senderId: users[1].id,
                receiverId: users[0].id,
                content: 'Hola Laura! Qué tal todo?'
            }
        }),
        prisma.message.create({
            data: {
                senderId: users[0].id,
                receiverId: users[1].id,
                content: 'Hola Fran! Todo bien, estudiando un montón jaja'
            }
        }),
        prisma.message.create({
            data: {
                senderId: users[2].id,
                receiverId: users[0].id,
                content: 'Oye, para lo del sábado, te apuntas?'
            }
        })
    ]);

    console.log(`✅ Created ${messages.length} messages`);

    // Create notifications
    const notifications = await Promise.all([
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'comment',
                content: 'María López ha comentado en tu publicación',
                relatedId: posts[0].id,
                relatedUserId: users[2].id
            }
        }),
        prisma.notification.create({
            data: {
                userId: users[0].id,
                type: 'message',
                content: 'Francisco José te ha enviado un mensaje',
                relatedId: messages[0].id,
                relatedUserId: users[1].id
            }
        })
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('   Email: laura@tuenti.com');
    console.log('   Password: password123');
    console.log('\n   (Same password for all users)');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
