const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const rootApiURL = "https://www.insidemaps.com/api/v2/";
const organizations = [
    { id: "DHHdznEAdR", mastertoken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6IkRISGR6bkVBZFIiLCJpYXQiOjE1OTQ4ODkzMTAsImV4cCI6MTYyNjQyNTMxMH0.B47E5RskLX20SnkVLjz0xRZbbTG60LvMZ_MdBn_-Pto" },
    { id: "p7sdXqUHvo", mastertoken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6InA3c2RYcVVIdm8iLCJpYXQiOjE1ODYzNDcwNDgsImV4cCI6MTYxNzg4MzA0OH0.w3quhvR49MS6m5Jch6w0Y2r_H_h1TvCiujYWaB0XlzY" }
];
const Project = (id, photo, name, status, creationDate, floors, rooms) => {
    return { id, photo, name, status, creationDate, floors, rooms };
};
const getOptions = (token) => {
    return {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    };
};
const getSessionToken = async (url, options) => {
    try {
        let data = [];
        let i = 0;
        while (i < options.length) {
            const fetchToken = await fetch(url, options[i])
            let org = await fetchToken.json();
            data.push(org.data);
            i++;
        }
        return data;
    } catch (error) {
        console.log(error);
    }
};
const getSessionTokenFromOrgId = async (organizationId) => {
    const url = rootApiURL + 'sessionToken/';
    const options = getOptions(organizations.find(o => o.id === organizationId).mastertoken);
    try {
        const fetchToken = await fetch(url, options);
        const sessionToken = await fetchToken.json();
        return sessionToken.data;
    } catch (error) {
        console.log(error);
    }
};

router.get('/', async (req, res, next) => {
    try {
        //get options with Bearer <master token>
        const options = organizations.map(org => getOptions(org.mastertoken));
        const sessionTokens = await getSessionToken(rootApiURL + "sessionToken/", options);
        //get options with Bearer <session token>
        const sessionOptions = sessionTokens.map(sessionToken => getOptions(sessionToken));
        let data = [];
        let i = 0;
        while (i < sessionOptions.length) {
            const fetchOrg = await fetch(rootApiURL + "organizations/" + organizations[i].id, sessionOptions[i]);
            let org = await fetchOrg.json();
            if (org.data)
                data.push(org.data);
            i++;
        }
        res.send(data);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

router.get('/:organizationId/projects/:loadWithDetails', async (req, res, next) => {
    const organizationId = req.params.organizationId;
    const loadDetails = req.params.loadWithDetails === 'true' ? true : false;
    const url = rootApiURL + "organizations/" + organizationId + '/projects/?status=all';//?updatedSince=2019-07-09
    const options = getOptions(await getSessionTokenFromOrgId(organizationId));
    try {
        const fetchProjects = await fetch(url, options);
        const projectData = await fetchProjects.json();
        const projectIds = projectData.data;
        const projectUrls = projectIds.map(p => rootApiURL + "projects/" + p);
        let projects = [];
        let i = 0;
        while (i < projectUrls.length) {
            //'hdr', 'hdr-custom-watermark', 'pano', 'equirectangular', 'inspect', 'scanless'
            const imageUrl = rootApiURL + "/projects/" + projectIds[i] + "/images/equirectangular/";
            let floors;
            let rooms;
            const fetchProject = await fetch(projectUrls[i], options);
            const fetchProjectImages = await fetch(imageUrl, options);
            let project = await fetchProject.json();
            let images = await fetchProjectImages.json();
            if (loadDetails === true) {
                floors = await getProjectDetails(projectIds[i], options, "floors");
                rooms = await getProjectDetails(projectIds[i], options, "rooms");
                projects.push(Project(projectIds[i], images.data, project.data.name, project.data.status, project.data.createdAt, floors, rooms));
            } else {
                projects.push(Project(projectIds[i], images.data, project.data.name, project.data.status, project.data.createdAt, [], []));
            }
            i++;
        }

        res.send(projects);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

getProjectDetails = async (projectId, options, opt) => {
    const url = rootApiURL + "projects/" + projectId + '/' + opt + '/';
    try {
        const fetchFloors = await fetch(url, options);
        const floorData = await fetchFloors.json();
        const floorIds = floorData.data;
        const floorUrls = floorIds.map(p => rootApiURL + opt + "/" + p);
        let floors = [];
        let i = 0;
        while (i < floorUrls.length) {
            const fetchRoomDetails = await fetch(floorUrls[i], options);
            let room = await fetchRoomDetails.json();
            floors.push(room.data);
            i++;
        }
        return floors;
    } catch (error) {
        console.log(error);
    }
}

// test - /org/p7sdXqUHvo/projects/NHf8thYGhQ/floors
router.get('/:organizationId/projects/:projectId/floors', async (req, res, next) => {
    const projectId = req.params.projectId;
    const organizationId = req.params.organizationId;
    const url = rootApiURL + "projects/" + projectId + '/floors/';
    const options = getOptions(await getSessionTokenFromOrgId(organizationId));
    try {
        const fetchFloors = await fetch(url, options);
        const floorData = await fetchFloors.json();
        const floorIds = floorData.data;
        const floorUrls = floorIds.map(p => rootApiURL + "floors/" + p);
        console.log(floorUrls);

        let floors = [];
        let i = 0;
        while (i < floorUrls.length) {
            const fetchRoomDetails = await fetch(floorUrls[i], options);
            let room = await fetchRoomDetails.json();
            floors.push(room.data);
            i++;
        }
        res.send(floors);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});
//test - /org/p7sdXqUHvo/projects/NHf8thYGhQ/rooms
router.get('/:organizationId/projects/:projectId/rooms', async (req, res, next) => {
    const projectId = req.params.projectId;
    const organizationId = req.params.organizationId;
    const url = rootApiURL + "projects/" + projectId + '/rooms/';
    const options = getOptions(await getSessionTokenFromOrgId(organizationId));
    try {
        const fetchRooms = await fetch(url, options);
        const roomData = await fetchRooms.json();
        const roomIds = roomData.data;
        const roomUrls = roomIds.map(p => rootApiURL + "rooms/" + p);
        let rooms = [];
        let i = 0;
        while (i < roomUrls.length) {
            const fetchRoomDetails = await fetch(roomUrls[i], options);
            let room = await fetchRoomDetails.json();
            rooms.push(room.data);
            i++;
        }
        res.send(rooms);
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});


module.exports = router;