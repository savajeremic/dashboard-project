const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const rootApiURL = "https://www.insidemaps.com/api/v2/";
const organizations = [
    { id: "DHHdznEAdR", mastertoken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6IkRISGR6bkVBZFIiLCJpYXQiOjE1OTQ4ODkzMTAsImV4cCI6MTYyNjQyNTMxMH0.B47E5RskLX20SnkVLjz0xRZbbTG60LvMZ_MdBn_-Pto" },
    { id: "p7sdXqUHvo", mastertoken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdhbml6YXRpb25JZCI6InA3c2RYcVVIdm8iLCJpYXQiOjE1ODYzNDcwNDgsImV4cCI6MTYxNzg4MzA0OH0.w3quhvR49MS6m5Jch6w0Y2r_H_h1TvCiujYWaB0XlzY" }
];
const imageTypes = ['hdr', 'hdr-custom-watermark', 'pano', 'equirectangular', 'inspect', 'scanless'];
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
            data.push(fetch(url, options[i]).then(data => data.json()).then(res => res.data));
            i++;
        }
        const finalData = await Promise.all(data);
        return finalData;
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
        return error;
    }
};

router.get('/', async (req, res, next) => {
    try {
        //get options with Bearer <master token>
        const options = organizations.map(org => getOptions(org.mastertoken));
        const sessionTokens = await getSessionToken(rootApiURL + "sessionToken/", options);
        //get options with Bearer <session token>
        const sessionOptions = sessionTokens.map(sessionToken => getOptions(sessionToken));
        const orgPromises = [];
        let i = 0;
        while (i < sessionOptions.length) {
            orgPromises.push(fetch(rootApiURL + "organizations/" + organizations[i].id, sessionOptions[i])
                .then(data => data.json())
                .then(res => res.data)
            );
            i++;
        }
        const data = await Promise.all(orgPromises);
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
        const projectPromises = [];
        const imagePromises = [];
        const floorsPromises = [];
        const roomsPromises = [];
        let i = 0;
        while (i < projectUrls.length) {
            projectPromises.push(fetch(projectUrls[i], options)
                .then(data => data.json()).then(res => res.data)
            );
            imagePromises.push(fetch(rootApiURL + "/projects/" + projectIds[i] + "/images/" + imageTypes[3] + "/", options)
                .then(data => data.json()).then(res => res.data)
            );
            if (loadDetails === true) {
                floorsPromises.push(getProjectDetails(projectIds[i], options, "floors"));
                roomsPromises.push(getProjectDetails(projectIds[i], options, "rooms"));
            }
            i++;
        }
        const projectFinalData = await Promise.all(projectPromises);
        const projectImages = await Promise.all(imagePromises);
        const projectFloors = await Promise.all(floorsPromises);
        const projectRooms = await Promise.all(roomsPromises);
        const responseData = [];
        projectFinalData.forEach((project, i) =>
            responseData.push(Project(projectData.data[i], projectImages[i], project.name, project.status, project.createdAt, projectFloors[i], projectRooms[i]))
        );
        res.send(responseData);
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
            floors.push(fetch(floorUrls[i], options).then(data => data.json()).then(res => res.data));
            i++;
        }
        const results = await Promise.all(floors);
        return results;
    } catch (error) {
        console.log(error);
    }
}

module.exports = router;