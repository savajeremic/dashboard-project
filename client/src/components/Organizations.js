import React, { Component } from 'react';
import { List, ListItemText, ListItem, CssBaseline, AppBar, Toolbar, Typography, Drawer, withStyles, CircularProgress, Card, CardActionArea, CardContent, CardMedia, FormControl, RadioGroup, FormControlLabel, Radio, GridList, GridListTile, LinearProgress, Checkbox } from '@material-ui/core';
import BusinessIcon from '@material-ui/icons/Business';
import FindReplaceIcon from '@material-ui/icons/FindReplace';
import DateRangeIcon from '@material-ui/icons/DateRange';
import DateFnsUtils from '@date-io/date-fns';
import './Organizations.css';

import {
    DateTimePicker,
    MuiPickersUtilsProvider,
} from '@material-ui/pickers';

const drawerWidth = 240;
const insideMapsColor = '#c05142';
const blackColor = "#000";
const whiteColor = "#fff";
const styles = theme => ({
    root: {
        display: 'flex',
        color: blackColor
    },
    logo: {
        width: '12%',
        height: '12%'
    },
    logoText: {
        color: blackColor,
        marginLeft: '1%'
    },
    drawer: {
        [theme.breakpoints.up('sm')]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: whiteColor
    },
    backgroundTop: {
        background: 'linear-gradient(270deg, #595959, transparent)',
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth,
        paddingLeft: '1%',
        paddingTop: '1%',
        background: "linear-gradient(0deg, #595959a3, transparent)"
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
    contentLoaded: {
        flexGrow: 1,
        padding: theme.spacing(3),
        background: '#e5e5e5',
        //background: "linear-gradient(270deg, #595959a3, transparent)",//#c05142 115deg
    },
    closeMenuButton: {
        marginRight: 'auto',
        marginLeft: 0,
    },
    cards: {
        display: 'flex',
    },
    snackbar: {
        width: '100%',
        '& > * + *': {
            marginTop: theme.spacing(2),
        },
    },
    filterbar: {
        textAlign: '-webkit-center',
        //background: '#3f51b533',
        padding: '2%',
    },
    datePicker: {
        paddingRight: '5%',
    },
    gridImages: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        width: '100 % !important',
        height: '100 % !important',
        flexWrap: 'nowrap',
        transform: 'translateZ(0)',
    },
    title: {
        color: theme.palette.primary.light,
    },
    titleP: {
        textAlign: 'center',
        alignSelf: 'center',
        marginBottom: '1%'
    },
    loadingBlock: {
    },
    titleBar: {
        background:
            'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
    },
    card: {
        marginBottom: '5%',
        marginLeft: '15%',
        marginRight: '15%'
    },
    media: {
        height: '100%',
        width: '100%'
    },
    '@global': {
        '*::-webkit-scrollbar': {
            width: '0.7rem'
        },
        '*::-webkit-scrollbar-track': {
            '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)'
        },
        '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#9a9a9a',
            outline: '1px solid #9a9a9a',
            borderRadius: '0.5rem'
        }
    }
});

class Organizations extends Component {
    constructor(props) {
        super(props);
        this.state = {
            initLoad: true,
            loading: false,
            orgs: [],
            projects: [],
            tempProjects: [],
            currentOrganization: '',
            selectedDateFrom: new Date(),
            selectedDateTo: new Date(),
            handleFromDateChange: this.handleFromDateChange,
            handleToDateChange: this.handleToDateChange,
            radioTarget: 'all',
            loadWithDetails: false
        };
    }

    componentDidMount() {
        fetch('/org')
            .then(res => res.json())
            .then(orgs => this.setState({ orgs }, () => console.log('Organizations fetched', orgs)))
            .catch(err => console.log(err))
            .finally(_ => this.setState({ initLoad: false }));
    }
    handleRadioChange = (event) => {
        let radioTarget = event.target.value;
        this.setState({ radioTarget }, this.filterProjects);
    }
    handleCheckbox = (event) => {
        let loadWithDetails = event.target.checked;
        this.setState({ loadWithDetails }, () => console.log('Loading with rooms and floors: ' + this.state.loadWithDetails));
    }
    handleFromDateChange = (date) => {
        const formattedDate = date.toISOString();
        if (formattedDate > this.state.selectedDateTo) {
            alert("The 'from' date cannot be bigger than the 'to' date.");
            return false;
        }
        this.setState({ selectedDateFrom: formattedDate }, this.filterProjects);
    }
    handleToDateChange = (date) => {
        const formattedDate = date.toISOString();
        if (formattedDate < this.state.selectedDateFrom) {
            alert("The 'to' date cannot be bigger than the 'from' date.");
            return false;
        }
        this.setState({ selectedDateTo: formattedDate }, this.filterProjects);
    }
    filterProjects = () => {
        let from = this.state.selectedDateFrom;
        let to = this.state.selectedDateTo;
        let status = this.state.radioTarget;
        let tempProjects = this.state.projects.filter(p => (status === 'all' ? true : p.status === status) && p.creationDate >= from && p.creationDate <= to);
        this.setState({ tempProjects });
    }

    setDatePickers = () => {
        this.state.projects.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate));
        let min = this.state.projects[0].creationDate;
        let max = this.state.projects[this.state.projects.length - 1].creationDate;
        this.setState({ selectedDateFrom: min, selectedDateTo: max });
    };

    getProjects = (org) => {
        if (this.state.currentOrganization === org && this.state.projects.length > 0) {
            let dialog = window.confirm("The selected organization has projects listed already on screen. Wanna load again anyway?");
            if (dialog === true) {
            } else {
                return false;
            }
        }

        this.setState({ loading: true });
        if (org) {
            fetch('/org/' + org + '/projects/' + this.state.loadWithDetails)
                .then(res => res.json())
                .then(projects => {
                    if (projects.length > 0) {
                        this.setState({ projects, tempProjects: projects, currentOrganization: org }, this.setDatePickers);
                    } else {
                        alert("Server couldn't find any projects for selected organization.");
                    }
                })
                .catch(err => console.log(err))
                .finally(_ => {
                    this.setState({ loading: false });
                });
        }
    };

    render() {
        const { classes } = this.props;
        const statuses = ['created', 'processing', 'finished', 'all'];
        return (
            <div className={classes.root}>
                <CssBaseline />
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar className={classes.backgroundTop}>
                        <img className={classes.logo} src="/logo-black.png" />
                        <Typography className={classes.logoText} variant="h6" noWrap>
                            Dashboard Homework
                        </Typography>
                    </Toolbar>
                </AppBar>

                <nav className={classes.drawer}>
                    <Drawer
                        className={classes.drawer}
                        variant="permanent"
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                    >
                        <div className={classes.toolbar} />
                        <div>
                            <Typography variant="h6" style={{ display: 'inline-block', alignItems: 'center' }}>
                                <BusinessIcon></BusinessIcon>Organizations
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={this.state.loadWithDetails}
                                            onChange={this.handleCheckbox}
                                            inputProps={{ 'aria-label': 'primary checkbox' }}
                                            name="projectDetails"
                                            color="primary"
                                        />
                                    }
                                    label="load with rooms and floors?"
                                />
                            </Typography>
                            {this.state.initLoad ? <CircularProgress color="primary" style={{ alignSelf: "center" }} /> : ''}
                            <List>
                                {this.state.orgs.map((org, i) => (
                                    <ListItem button key={org.id} onMouseDown={() => this.getProjects(org.id)} >
                                        <ListItemText primary={i + 1 + '. ' + org.name} />
                                    </ListItem>
                                ))}
                            </List>
                        </div>
                        <div>
                            <Typography variant="h6" style={{ display: 'flex', alignItems: 'center' }}>
                                <DateRangeIcon></DateRangeIcon>Date Filter Bar
                            </Typography>
                            {this.state.projects.length > 0 ?
                                <>
                                    <div className={classes.filterbar}>
                                        <Typography variant="h6">
                                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                                <DateTimePicker className={classes.datePicker}
                                                    value={this.state.selectedDateFrom}
                                                    variant="outlined"
                                                    ampm={false}
                                                    onChange={this.state.handleFromDateChange}
                                                    format="dd/MM/yyyy HH:mm:ss"
                                                    label="Show projects from"
                                                    views={["year", "month", "date"]}
                                                />
                                                <DateTimePicker className={classes.datePicker}
                                                    value={this.state.selectedDateTo}
                                                    variant="outlined"
                                                    ampm={false}
                                                    onChange={this.state.handleToDateChange}
                                                    format="dd/MM/yyyy HH:mm:ss"
                                                    label="Show projects to"
                                                    views={["year", "month", "date"]}
                                                />
                                            </MuiPickersUtilsProvider>
                                        </Typography>
                                    </div>
                                </>
                                : <> Select an organization first to filter...<br /><br /></>
                            }
                        </div>
                        <div>
                            <FormControl component="fieldset">
                                <Typography variant="h6" style={{ display: 'flex', alignItems: 'center' }}>
                                    <FindReplaceIcon></FindReplaceIcon>Project status filter
                                </Typography>
                                {this.state.projects.length > 0 ?
                                    <>
                                        <RadioGroup aria-label="gender" name="gender1" value={this.state.radioTarget} onChange={this.handleRadioChange}>
                                            {statuses.map((status, i) => (
                                                <FormControlLabel key={i} style={{ marginLeft: '10px' }} value={status} control={<Radio />} label={status} />
                                            ))}
                                        </RadioGroup>
                                    </>
                                    : <> Select an organization first to filter...<br /><br /></>
                                }
                            </FormControl>
                        </div>
                    </Drawer>
                </nav>
                <div className={(this.state.projects.length > 0) ? (classes.contentLoaded) : (classes.content)}>
                    <div className={classes.toolbar} />
                    <div className={classes.loadingBlock}>
                        {this.state.projects.length > 0 ? <Typography variant="h4" className={classes.titleP} style={{ color: "#000" }}>Projects:</Typography>
                            : <Typography variant="h4" className={classes.titleP}>Click on an organization to view projects here</Typography>}
                        {this.state.loading
                            ? <Typography variant="h4" className={classes.titleP}>
                                Loading projects(might take a while): <LinearProgress className={classes.titleP} color="secondary" style={{ alignSelf: "center" }} />
                            </Typography>
                            : ''
                        }
                    </div>
                    {this.state.tempProjects.map(project => (
                        <Card key={project.id} className={classes.card}>
                            <div style={{ display: "block", minWidth: '100%' }}>
                                <div>
                                    <GridList className={classes.gridList} cols={2.5}>
                                        {project.photo.length > 0 ? project.photo.map((photo, i) => (
                                            <GridListTile key={i} >
                                                <CardMedia
                                                    className={classes.media}
                                                    component="img"
                                                    alt="Project image"
                                                    src={photo ? photo : '/placeholder-img.jpg'}
                                                    onError={e => {
                                                        e.target.src = "/placeholder-img.jpg";
                                                        e.target.style.width = "50%";
                                                        e.target.style.height = "50%";
                                                    }}
                                                    title="Project image"
                                                />
                                            </GridListTile>
                                        ))
                                            : <CardMedia
                                                className={classes.media}
                                                style={{ height: '100%', marginLeft: '30%' }}
                                                component="img"
                                                alt="Project image"
                                                src='/placeholder-img.jpg'
                                                title="Project image"
                                            />}
                                    </GridList>
                                </div>
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        {project.name}
                                    </Typography>

                                    <Typography variant="body2" color="textSecondary" component="p" style={{ fontWeight: 'bold' }}>
                                        Status: {project.status}<br /><br />Creation date: {project.creationDate}
                                        {this.state.loadWithDetails ?
                                            <>
                                                <br /><br />
                                    Floor names: {(project.floors.length > 0 && project.floors !== null)
                                                    ? project.floors.map((floor, i) => floor !== null ? floor.name + (i !== project.floors.length - 1 ? ', ' : '') : 'empty') : 'empty'}
                                                <br /><br />
                                    Room names: {(project.rooms.length > 0 && project.rooms !== null)
                                                    ? project.rooms.map((room, i) => room !== null ? room.name + (i !== project.rooms.length - 1 ? ', ' : '') : 'empty') : 'empty'}
                                            </>
                                            : ''}
                                    </Typography>
                                </CardContent>
                            </div>
                        </Card>
                    ))}
                </div>
            </div >
        );
    }
}

export default withStyles(styles, { withTheme: true })(Organizations);
