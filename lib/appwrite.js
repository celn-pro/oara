import { Client, Account, ID, Avatars, Databases, Storage } from 'react-native-appwrite';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.celn.aura',
    projectId:'66278dd0beab3e29b97e',
    databaseId: '6627907f4b59c4b0b838',
    userCollectionId: '662790b4b38a597189bd',
    videoCollectionId: '662790ece9b82f0441b5',
    storageId: '66279414002764d29b49'
}

const {
    endpoint,
platform,
projectId,
databaseId,
userCollectionId,
videoCollectionId,
storageId,
} = config

const client = new Client();

client
    .setEndpoint(config.endpoint) // Your Appwrite Endpoint
    .setProject(config.projectId) // Your project ID
    .setPlatform(config.platform); // Your application ID or bundle ID
    
const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client)
const storage = new Storage(client)


export const createUser = async(email, password, username) => {
    try {

        // Register a user
        const newAccount = await account.create(
            ID.unique(),
            email, 
            password, 
            username
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username)

        await signIn(email, password)

        const newUser = await databases.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                accountNum: newAccount.$id,
                email,
                username,
                avatar: avatarUrl
            }
        )

        return newUser

    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

export const signIn = async(email, password) => {
    try {
        const session = await account.createEmailSession(email, password)

        return session
    } catch (error) {
        throw new Error(error)
    }
}

export const getCurrentUser = async() => {
    try {
        const currentAccount = await account.get()

        if(!currentAccount) throw Error

        const currentUser = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('accountNum', currentAccount.$id)]
        )

        if(!currentUser) throw Error

        return currentUser.documents[0]
    } catch (error) {
        console.log(error)
    }
}

export const getAllPosts = async() => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$cratedAt')]
        )

        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const getLatestPosts = async() => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$cratedAt', Query.limit(7))]
        )

        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const searchPosts = async(query) => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.search('title', query)]
        )

        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const getUserPosts = async(userId) => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.equal('creator', userId), Query.orderDesc('$createdAt')]
        )

        return posts.documents
    } catch (error) {
        throw new Error(error)
    }
}

export const signOut = async() => {

    try {
        const session = await account.deleteSession('current')

        return session
    } catch (error) {
        throw new Error(error)
    }
}

export const getFilePreView = async(fileId, type) =>{
    let fileUrl

    try {
        if(type === 'video') {

            fileUrl = storage.getFileView(storageId, fileId)

        }else if(type === 'image') {
            
            fileUrl = storage.getFilePreView(
                storageId,
                fileId, 
                2000, 2000, 'top', 100
            )
        }else{
            throw new Error('Invalid file type')
        }

        if(!fileUrl) throw Error

        return fileUrl

    } catch (error) {
        throw new Error(error)
    }
}

export const uploadFile = async(file, type) => {
    if(!file) return

    const asset = {
        name: file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri

    }

    try {
        const uploadedFile = await storage.createFile(
            storageId,
            ID.unique(),
            asset
        )

        const fileUrl = await getFilePreView(uploadedFile.$id, type)

        return fileUrl
    } catch (error) {
        throw new Error(error)
    }
}

export const createVideo = async() => {
    try {
        const [thumbnailUrl, videoUrl] = await Promise.all([
            uploadFile(form.thumbnail, 'image'),
            uploadFile(form.video, 'video')  

        ])

        const newPost = await databases.createDocument(
            databaseId,
            videoCollectionId,
            ID.unique(),
            {
                title: form.title,
                thumbnail: thumbnailUrl,
                video: videoUrl, 
                prompt: form.prompt,
                creator: form.userId,
            }

        )

        return newPost
    } catch (error) {
        throw new Error(error)
    }
}
