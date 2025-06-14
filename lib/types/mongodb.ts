import { ObjectId } from "mongodb";

export interface UserStats {
    easy: number;
    medium: number;
    hard: number;
    total: number;
    lastUpdated: Date;
}

export interface PartyMember {
    email: string;
    handle: string;
    leetcodeUsername: string;
    displayName: string;
    joinedAt: Date;
    isOwner: boolean;
    stats: UserStats;
}

export interface Party {
    _id?: ObjectId;
    code: string;
    name: string;
    password: string | null;
    maxMembers: number | null;
    createdAt: Date;
    createdBy: string;
    lastActivity?: Date;
    members: PartyMember[];
}

export interface User {
    _id?: ObjectId;
    email: string;
    displayName: string;
    createdAt: Date;
    lastActive: Date;
    joinedParties: string[];
}

export interface PartyPreview {
    name: string;
    code: string;
    memberCount: number;
    maxMembers?: number | null;
    createdAt: Date;
    isOwner: boolean;
}